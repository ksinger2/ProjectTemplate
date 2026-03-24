import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db, sqlite } from '../db';
import { schema } from '../db';
import { eq } from 'drizzle-orm';

// ---- Configuration ----

const MEDIA_PATH = path.resolve(__dirname, '../../../', process.env.MEDIA_PATH || '../media');
const SUBTITLES_PATH = path.resolve(__dirname, '../../../', process.env.SUBTITLES_PATH || '../subtitles');
const DATA_PATH = path.resolve(__dirname, '../../../', process.env.DATA_PATH || '../data');
const THUMBNAILS_PATH = path.join(DATA_PATH, 'thumbnails');

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.webm', '.mov', '.m4v', '.wmv', '.flv']);
const AUDIO_EXTENSIONS = new Set(['.mp3', '.flac', '.aac', '.ogg', '.wav', '.m4a', '.wma']);
const SUBTITLE_EXTENSIONS = new Set(['.srt', '.vtt']);

// ---- Types ----

interface SidecarMetadata {
  title?: string;
  description?: string;
  genres?: string[];
  keywords?: string[];
  year?: number;
  poster?: string;
}

interface ProbeResult {
  durationSeconds: number | null;
  codec: string | null;
  resolution: string | null;
}

interface ScanResult {
  scanned: number;
  added: number;
  updated: number;
}

// ---- ffprobe / ffmpeg helpers ----

let ffmpegAvailable: boolean | null = null;

function checkFfmpeg(): boolean {
  if (ffmpegAvailable !== null) return ffmpegAvailable;
  try {
    const { execSync } = require('child_process');
    execSync('ffprobe -version', { stdio: 'ignore' });
    ffmpegAvailable = true;
  } catch {
    console.warn('[scanner] ffprobe/ffmpeg not found. Metadata extraction and thumbnail generation will be skipped.');
    ffmpegAvailable = false;
  }
  return ffmpegAvailable;
}

function probeFile(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve) => {
    if (!checkFfmpeg()) {
      resolve({ durationSeconds: null, codec: null, resolution: null });
      return;
    }

    try {
      const ffmpeg = require('fluent-ffmpeg') as typeof import('fluent-ffmpeg');
      ffmpeg.ffprobe(filePath, (err: Error | null, metadata: any) => {
        if (err) {
          console.warn(`[scanner] ffprobe failed for ${filePath}: ${err.message}`);
          resolve({ durationSeconds: null, codec: null, resolution: null });
          return;
        }

        const duration = metadata.format?.duration
          ? Math.round(metadata.format.duration)
          : null;

        const videoStream = metadata.streams?.find((s: any) => s.codec_type === 'video');
        const audioStream = metadata.streams?.find((s: any) => s.codec_type === 'audio');

        const codec = videoStream?.codec_name || audioStream?.codec_name || null;
        const resolution = videoStream
          ? `${videoStream.width}x${videoStream.height}`
          : null;

        resolve({ durationSeconds: duration, codec, resolution });
      });
    } catch (e: any) {
      console.warn(`[scanner] ffprobe error: ${e.message}`);
      resolve({ durationSeconds: null, codec: null, resolution: null });
    }
  });
}

function generateThumbnail(filePath: string, mediaId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!checkFfmpeg()) {
      resolve(false);
      return;
    }

    try {
      const ffmpeg = require('fluent-ffmpeg') as typeof import('fluent-ffmpeg');

      // Ensure thumbnails directory exists
      if (!fs.existsSync(THUMBNAILS_PATH)) {
        fs.mkdirSync(THUMBNAILS_PATH, { recursive: true });
      }

      const outputPath = path.join(THUMBNAILS_PATH, `${mediaId}.jpg`);

      // Extract frame at 10% of duration
      ffmpeg(filePath)
        .screenshots({
          count: 1,
          timemarks: ['10%'],
          folder: THUMBNAILS_PATH,
          filename: `${mediaId}.jpg`,
          size: '640x?',
        })
        .on('end', () => resolve(true))
        .on('error', (err: Error) => {
          console.warn(`[scanner] Thumbnail generation failed for ${filePath}: ${err.message}`);
          resolve(false);
        });
    } catch (e: any) {
      console.warn(`[scanner] Thumbnail error: ${e.message}`);
      resolve(false);
    }
  });
}

// ---- File system helpers ----

function readSidecarMetadata(dir: string, fileName?: string): SidecarMetadata | null {
  // Check for metadata.json in the same directory as the file
  const metadataPath = path.join(dir, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    try {
      const raw = fs.readFileSync(metadataPath, 'utf-8');
      return JSON.parse(raw) as SidecarMetadata;
    } catch (e: any) {
      console.warn(`[scanner] Failed to parse ${metadataPath}: ${e.message}`);
    }
  }
  return null;
}

function walkDir(dirPath: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dirPath)) return results;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function findSubtitlesForMedia(mediaFilePath: string, mediaBaseName: string): Array<{ language: string; label: string; filePath: string }> {
  const subs: Array<{ language: string; label: string; filePath: string }> = [];
  const mediaDir = path.dirname(mediaFilePath);

  // Look in same directory for matching subtitle files
  const searchDirs = [mediaDir];

  // Also look in a subtitles subdirectory
  const subtitlesSubdir = path.join(mediaDir, 'subtitles');
  if (fs.existsSync(subtitlesSubdir)) {
    searchDirs.push(subtitlesSubdir);
  }

  // Also search the global subtitles path
  if (fs.existsSync(SUBTITLES_PATH)) {
    searchDirs.push(SUBTITLES_PATH);
  }

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const ext = path.extname(entry).toLowerCase();
      if (!SUBTITLE_EXTENSIONS.has(ext)) continue;

      const entryBase = path.basename(entry, ext);
      // Match patterns: mediaBaseName.lang.ext or mediaBaseName.ext
      if (entryBase.startsWith(mediaBaseName)) {
        const parts = entryBase.split('.');
        const language = parts.length > 1 ? parts[parts.length - 1] : 'en';
        const label = getLanguageLabel(language);
        subs.push({
          language,
          label,
          filePath: path.join(dir, entry),
        });
      }
    }
  }

  return subs;
}

function getLanguageLabel(code: string): string {
  const labels: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    ru: 'Russian',
    ar: 'Arabic',
    hi: 'Hindi',
  };
  return labels[code.toLowerCase()] || code.toUpperCase();
}

// ---- Show episode parsing ----

interface EpisodeInfo {
  showName: string;
  season: number;
  episode: number;
  episodeTitle: string;
}

function parseEpisodePath(filePath: string, showsRoot: string): EpisodeInfo | null {
  const relative = path.relative(showsRoot, filePath);
  const parts = relative.split(path.sep);

  if (parts.length < 2) return null;

  const showName = parts[0];

  // Try to parse S01E01 pattern from the filename
  const fileName = path.basename(filePath, path.extname(filePath));
  const episodeMatch = fileName.match(/S(\d{1,2})E(\d{1,2})\s*[-–]?\s*(.*)/i);

  if (!episodeMatch) return null;

  const season = parseInt(episodeMatch[1], 10);
  const episode = parseInt(episodeMatch[2], 10);
  const episodeTitle = episodeMatch[3].trim() || `Episode ${episode}`;

  return { showName, season, episode, episodeTitle };
}

// ---- Game detection ----

function findGames(gamesDir: string): Array<{ name: string; dirPath: string }> {
  const games: Array<{ name: string; dirPath: string }> = [];
  if (!fs.existsSync(gamesDir)) return games;

  const entries = fs.readdirSync(gamesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(gamesDir, entry.name, 'index.html');
    if (fs.existsSync(indexPath)) {
      games.push({ name: entry.name, dirPath: path.join(gamesDir, entry.name) });
    }
  }
  return games;
}

// ---- FTS helpers ----

function ensureFtsTable(): void {
  // Create FTS5 virtual table if it doesn't exist
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS media_fts USING fts5(
      media_id UNINDEXED,
      title,
      description,
      genres,
      keywords
    );
  `);
}

function upsertFts(mediaId: string, title: string, description: string | null, genres: string[], keywords: string[]): void {
  // Delete existing entry
  sqlite.prepare('DELETE FROM media_fts WHERE media_id = ?').run(mediaId);

  // Insert new entry
  sqlite.prepare(
    'INSERT INTO media_fts (media_id, title, description, genres, keywords) VALUES (?, ?, ?, ?, ?)'
  ).run(
    mediaId,
    title,
    description || '',
    genres.join(' '),
    keywords.join(' ')
  );
}

// ---- Main scanner ----

export async function scanMediaLibrary(): Promise<ScanResult> {
  const result: ScanResult = { scanned: 0, added: 0, updated: 0 };

  ensureFtsTable();

  const moviesDir = path.join(MEDIA_PATH, 'movies');
  const showsDir = path.join(MEDIA_PATH, 'shows');
  const musicDir = path.join(MEDIA_PATH, 'music');
  const gamesDir = path.join(MEDIA_PATH, 'games');

  // ---- Scan movies ----
  await scanMovies(moviesDir, result);

  // ---- Scan shows ----
  await scanShows(showsDir, result);

  // ---- Scan music ----
  await scanMusic(musicDir, result);

  // ---- Scan games ----
  scanGames(gamesDir, result);

  console.log(`[scanner] Scan complete: scanned=${result.scanned}, added=${result.added}, updated=${result.updated}`);
  return result;
}

async function scanMovies(moviesDir: string, result: ScanResult): Promise<void> {
  const files = walkDir(moviesDir);
  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (!VIDEO_EXTENSIONS.has(ext)) continue;

    result.scanned++;
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    const sidecar = readSidecarMetadata(dir);

    const title = sidecar?.title || baseName.replace(/[._-]/g, ' ').trim();

    // Check if already exists by file path
    const existing = db.select().from(schema.media).where(eq(schema.media.filePath, filePath)).get();

    const probe = await probeFile(filePath);
    const mediaId = existing?.id || uuidv4();

    // Resolve poster URL from sidecar
    let posterUrl: string | null = null;
    if (sidecar?.poster) {
      const posterPath = path.join(dir, sidecar.poster);
      if (fs.existsSync(posterPath)) {
        posterUrl = `/api/media/${mediaId}/poster`;
      }
    }

    const genres = JSON.stringify(sidecar?.genres || []);
    const keywords = JSON.stringify(sidecar?.keywords || []);
    const now = new Date().toISOString();

    if (existing) {
      db.update(schema.media).set({
        title,
        description: sidecar?.description || existing.description,
        year: sidecar?.year || existing.year,
        genres,
        keywords,
        posterUrl,
        durationSeconds: probe.durationSeconds ?? existing.durationSeconds,
        codec: probe.codec ?? existing.codec,
        resolution: probe.resolution ?? existing.resolution,
        updatedAt: now,
      }).where(eq(schema.media.id, existing.id)).run();
      result.updated++;
    } else {
      db.insert(schema.media).values({
        id: mediaId,
        title,
        type: 'movie',
        filePath,
        description: sidecar?.description || null,
        year: sidecar?.year || null,
        genres,
        keywords,
        posterUrl,
        durationSeconds: probe.durationSeconds,
        codec: probe.codec,
        resolution: probe.resolution,
        createdAt: now,
        updatedAt: now,
      }).run();
      result.added++;
    }

    // Generate thumbnail for video files
    await generateThumbnail(filePath, mediaId);

    // Index in FTS
    upsertFts(mediaId, title, sidecar?.description || null, sidecar?.genres || [], sidecar?.keywords || []);

    // Discover subtitles
    syncSubtitles(mediaId, null, filePath, baseName);
  }
}

async function scanShows(showsDir: string, result: ScanResult): Promise<void> {
  if (!fs.existsSync(showsDir)) return;

  const files = walkDir(showsDir);
  const videoFiles = files.filter((f) => VIDEO_EXTENSIONS.has(path.extname(f).toLowerCase()));

  // Group episodes by show
  const showMap = new Map<string, Array<{ filePath: string; info: EpisodeInfo }>>();

  for (const filePath of videoFiles) {
    const info = parseEpisodePath(filePath, showsDir);
    if (!info) continue;

    if (!showMap.has(info.showName)) {
      showMap.set(info.showName, []);
    }
    showMap.get(info.showName)!.push({ filePath, info });
  }

  for (const [showName, episodes] of showMap) {
    result.scanned++;

    const showDir = path.join(showsDir, showName);
    const sidecar = readSidecarMetadata(showDir);
    const title = sidecar?.title || showName.replace(/[._-]/g, ' ').trim();

    // Check if show media entry exists
    const existingShow = db.select().from(schema.media).where(eq(schema.media.filePath, showDir)).get();
    const showId = existingShow?.id || uuidv4();

    let posterUrl: string | null = null;
    if (sidecar?.poster) {
      const posterPath = path.join(showDir, sidecar.poster);
      if (fs.existsSync(posterPath)) {
        posterUrl = `/api/media/${showId}/poster`;
      }
    }

    const genres = JSON.stringify(sidecar?.genres || []);
    const keywords = JSON.stringify(sidecar?.keywords || []);
    const now = new Date().toISOString();

    if (existingShow) {
      db.update(schema.media).set({
        title,
        description: sidecar?.description || existingShow.description,
        year: sidecar?.year || existingShow.year,
        genres,
        keywords,
        posterUrl,
        updatedAt: now,
      }).where(eq(schema.media.id, showId)).run();
      result.updated++;
    } else {
      db.insert(schema.media).values({
        id: showId,
        title,
        type: 'show',
        filePath: showDir,
        description: sidecar?.description || null,
        year: sidecar?.year || null,
        genres,
        keywords,
        posterUrl,
        durationSeconds: null,
        codec: null,
        resolution: null,
        createdAt: now,
        updatedAt: now,
      }).run();
      result.added++;
    }

    // FTS index for the show
    upsertFts(showId, title, sidecar?.description || null, sidecar?.genres || [], sidecar?.keywords || []);

    // Upsert episodes
    for (const { filePath, info } of episodes) {
      result.scanned++;

      const existingEp = db.select().from(schema.episodes).where(eq(schema.episodes.filePath, filePath)).get();
      const episodeId = existingEp?.id || uuidv4();

      const probe = await probeFile(filePath);

      if (existingEp) {
        db.update(schema.episodes).set({
          season: info.season,
          episode: info.episode,
          title: info.episodeTitle,
          durationSeconds: probe.durationSeconds ?? existingEp.durationSeconds,
        }).where(eq(schema.episodes.id, episodeId)).run();
      } else {
        db.insert(schema.episodes).values({
          id: episodeId,
          showId,
          season: info.season,
          episode: info.episode,
          title: info.episodeTitle,
          filePath,
          durationSeconds: probe.durationSeconds,
        }).run();
      }

      // Generate thumbnail for first episode if show has none
      await generateThumbnail(filePath, episodeId);

      // Discover subtitles for this episode
      const epBaseName = path.basename(filePath, path.extname(filePath));
      syncSubtitles(showId, episodeId, filePath, epBaseName);
    }
  }
}

async function scanMusic(musicDir: string, result: ScanResult): Promise<void> {
  const files = walkDir(musicDir);
  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (!AUDIO_EXTENSIONS.has(ext)) continue;

    result.scanned++;
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    const sidecar = readSidecarMetadata(dir);

    const title = sidecar?.title || baseName.replace(/[._-]/g, ' ').trim();

    const existing = db.select().from(schema.media).where(eq(schema.media.filePath, filePath)).get();
    const probe = await probeFile(filePath);
    const mediaId = existing?.id || uuidv4();

    let posterUrl: string | null = null;
    if (sidecar?.poster) {
      const posterPath = path.join(dir, sidecar.poster);
      if (fs.existsSync(posterPath)) {
        posterUrl = `/api/media/${mediaId}/poster`;
      }
    }

    const genres = JSON.stringify(sidecar?.genres || []);
    const keywords = JSON.stringify(sidecar?.keywords || []);
    const now = new Date().toISOString();

    if (existing) {
      db.update(schema.media).set({
        title,
        description: sidecar?.description || existing.description,
        year: sidecar?.year || existing.year,
        genres,
        keywords,
        posterUrl,
        durationSeconds: probe.durationSeconds ?? existing.durationSeconds,
        codec: probe.codec ?? existing.codec,
        resolution: probe.resolution ?? existing.resolution,
        updatedAt: now,
      }).where(eq(schema.media.id, existing.id)).run();
      result.updated++;
    } else {
      db.insert(schema.media).values({
        id: mediaId,
        title,
        type: 'music',
        filePath,
        description: sidecar?.description || null,
        year: sidecar?.year || null,
        genres,
        keywords,
        posterUrl,
        durationSeconds: probe.durationSeconds,
        codec: probe.codec,
        resolution: probe.resolution,
        createdAt: now,
        updatedAt: now,
      }).run();
      result.added++;
    }

    upsertFts(mediaId, title, sidecar?.description || null, sidecar?.genres || [], sidecar?.keywords || []);
  }
}

function scanGames(gamesDir: string, result: ScanResult): void {
  const games = findGames(gamesDir);
  for (const game of games) {
    result.scanned++;

    const sidecar = readSidecarMetadata(game.dirPath);
    const title = sidecar?.title || game.name.replace(/[._-]/g, ' ').trim();

    const existing = db.select().from(schema.media).where(eq(schema.media.filePath, game.dirPath)).get();
    const mediaId = existing?.id || uuidv4();

    let posterUrl: string | null = null;
    if (sidecar?.poster) {
      const posterPath = path.join(game.dirPath, sidecar.poster);
      if (fs.existsSync(posterPath)) {
        posterUrl = `/api/media/${mediaId}/poster`;
      }
    }

    const genres = JSON.stringify(sidecar?.genres || []);
    const keywords = JSON.stringify(sidecar?.keywords || []);
    const now = new Date().toISOString();

    if (existing) {
      db.update(schema.media).set({
        title,
        description: sidecar?.description || existing.description,
        year: sidecar?.year || existing.year,
        genres,
        keywords,
        posterUrl,
        updatedAt: now,
      }).where(eq(schema.media.id, existing.id)).run();
      result.updated++;
    } else {
      db.insert(schema.media).values({
        id: mediaId,
        title,
        type: 'game',
        filePath: game.dirPath,
        description: sidecar?.description || null,
        year: sidecar?.year || null,
        genres,
        keywords,
        posterUrl,
        durationSeconds: null,
        codec: null,
        resolution: null,
        createdAt: now,
        updatedAt: now,
      }).run();
      result.added++;
    }

    upsertFts(mediaId, title, sidecar?.description || null, sidecar?.genres || [], sidecar?.keywords || []);
  }
}

function syncSubtitles(mediaId: string, episodeId: string | null, mediaFilePath: string, baseName: string): void {
  const subs = findSubtitlesForMedia(mediaFilePath, baseName);

  for (const sub of subs) {
    // Check if this subtitle file already exists
    const existing = db.select().from(schema.subtitles).where(eq(schema.subtitles.filePath, sub.filePath)).get();

    if (!existing) {
      db.insert(schema.subtitles).values({
        id: uuidv4(),
        mediaId,
        episodeId,
        language: sub.language,
        label: sub.label,
        filePath: sub.filePath,
      }).run();
    }
  }
}
