import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db, sqlite } from '../db';
import { schema } from '../db';
import { eq, and, like, sql, asc } from 'drizzle-orm';
import { scanMediaLibrary } from '../services/media-scanner';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const DATA_PATH = path.resolve(__dirname, '../../../', process.env.DATA_PATH || '../data');
const THUMBNAILS_PATH = path.join(DATA_PATH, 'thumbnails');

// ---- Helper to parse JSON array fields ----

function parseMedia(row: typeof schema.media.$inferSelect) {
  const { filePath, ...rest } = row;
  return {
    ...rest,
    genres: safeJsonParse(row.genres),
    keywords: safeJsonParse(row.keywords),
  };
}

function safeJsonParse(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ---- GET /api/media/search — Full-text search (must be before :id) ----

router.get('/media/search', authMiddleware, (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();

    if (!q) {
      res.json({ success: true, data: [] });
      return;
    }

    // Sanitize the query for FTS5: escape double quotes, wrap terms
    const sanitized = q.replace(/"/g, '""');
    const ftsQuery = `"${sanitized}"`;

    const rows = sqlite.prepare(`
      SELECT m.* FROM media m
      INNER JOIN media_fts fts ON fts.media_id = m.id
      WHERE media_fts MATCH ?
      LIMIT 50
    `).all(ftsQuery) as Array<typeof schema.media.$inferSelect>;

    const results = rows.map((row: any) => {
      const { filePath, ...rest } = row;
      return {
        ...rest,
        genres: safeJsonParse(row.genres),
        keywords: safeJsonParse(row.keywords),
      };
    });

    res.json({ success: true, data: results });
  } catch (err: any) {
    console.error('[media/search] Error:', err.message);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// ---- GET /api/media — List media with filters ----

router.get('/media', authMiddleware, (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const genre = req.query.genre as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));

    const conditions: ReturnType<typeof eq>[] = [];

    if (type) {
      conditions.push(eq(schema.media.type, type));
    }

    if (genre) {
      // genres is stored as JSON array string, use LIKE for filtering
      conditions.push(like(schema.media.genres, `%"${genre}"%`));
    }

    const whereClause = conditions.length > 0
      ? and(...conditions)
      : undefined;

    // Get total count
    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.media)
      .where(whereClause)
      .get();

    const total = countResult?.count || 0;

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const rows = db
      .select()
      .from(schema.media)
      .where(whereClause)
      .orderBy(asc(schema.media.title))
      .limit(pageSize)
      .offset(offset)
      .all();

    const items = rows.map(parseMedia);
    const hasMore = offset + pageSize < total;

    res.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        hasMore,
      },
    });
  } catch (err: any) {
    console.error('[media] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch media' });
  }
});

// ---- GET /api/media/:id/thumbnail — Serve thumbnail ----

router.get('/media/:id/thumbnail', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;

  // UUID validation to prevent path traversal
  if (!/^[a-f0-9-]{36}$/.test(id)) {
    res.status(400).json({ success: false, error: 'Invalid media ID format' });
    return;
  }

  const thumbnailPath = path.join(THUMBNAILS_PATH, `${id}.jpg`);

  if (!fs.existsSync(thumbnailPath)) {
    res.status(404).json({ success: false, error: 'Thumbnail not found' });
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Content-Type', 'image/jpeg');
  fs.createReadStream(thumbnailPath).pipe(res);
});

// ---- GET /api/media/:id — Get media detail ----

router.get('/media/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const mediaRow = db
      .select()
      .from(schema.media)
      .where(eq(schema.media.id, id))
      .get();

    if (!mediaRow) {
      res.status(404).json({ success: false, error: 'Media not found' });
      return;
    }

    const mediaData = parseMedia(mediaRow);

    // Get episodes (sorted by season then episode)
    const episodeRows = db
      .select()
      .from(schema.episodes)
      .where(eq(schema.episodes.showId, id))
      .orderBy(asc(schema.episodes.season), asc(schema.episodes.episode))
      .all();

    // Get subtitles
    const subtitleRows = db
      .select()
      .from(schema.subtitles)
      .where(eq(schema.subtitles.mediaId, id))
      .all();

    res.json({
      success: true,
      data: {
        ...mediaData,
        episodes: episodeRows.length > 0 ? episodeRows : undefined,
        subtitles: subtitleRows.length > 0 ? subtitleRows : undefined,
      },
    });
  } catch (err: any) {
    console.error('[media/:id] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch media' });
  }
});

// ---- GET /api/media/:id/episodes — List episodes with prev/next navigation ----

router.get('/media/:id/episodes', authMiddleware, (req: Request, res: Response) => {
  try {
    const showId = req.params.id as string;

    // Verify media exists and is a show
    const mediaRow = db
      .select()
      .from(schema.media)
      .where(eq(schema.media.id, showId))
      .get();

    if (!mediaRow) {
      res.status(404).json({ success: false, error: 'Media not found' });
      return;
    }

    if (mediaRow.type !== 'show') {
      res.status(400).json({ success: false, error: 'Media is not a show' });
      return;
    }

    const episodeRows = db
      .select()
      .from(schema.episodes)
      .where(eq(schema.episodes.showId, showId))
      .orderBy(asc(schema.episodes.season), asc(schema.episodes.episode))
      .all();

    // Build response with previous/next episode IDs
    const episodes = episodeRows.map((ep, idx) => ({
      ...ep,
      previousEpisodeId: idx > 0 ? episodeRows[idx - 1].id : null,
      nextEpisodeId: idx < episodeRows.length - 1 ? episodeRows[idx + 1].id : null,
    }));

    res.json({
      success: true,
      data: {
        showId,
        totalEpisodes: episodes.length,
        episodes,
      },
    });
  } catch (err: any) {
    console.error('[media/:id/episodes] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch episodes' });
  }
});

// ---- Game helper: find first file with extension in directory ----

function findFileWithExtension(dirPath: string, ext: string): string | null {
  try {
    const entries = fs.readdirSync(dirPath);
    const match = entries.find(f => path.extname(f).toLowerCase() === ext);
    return match || null;
  } catch {
    return null;
  }
}

// ---- GET /api/media/:id/game — Serve game HTML ----

router.get('/media/:id/game', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;

  // UUID validation to prevent path traversal
  if (!/^[a-f0-9-]{36}$/.test(id)) {
    res.status(400).json({ success: false, error: 'Invalid media ID format' });
    return;
  }

  const media = db.select().from(schema.media).where(eq(schema.media.id, id)).get();
  if (!media) {
    res.status(404).json({ success: false, error: 'Media not found' });
    return;
  }

  if (media.type !== 'game') {
    res.status(400).json({ success: false, error: 'Media is not a game' });
    return;
  }

  const gameType = media.gameType || 'html';

  // Flash games: serve Ruffle wrapper HTML
  if (gameType === 'flash') {
    const swfFile = findFileWithExtension(media.filePath, '.swf');
    if (!swfFile) {
      res.status(404).json({ success: false, error: 'SWF file not found in game directory' });
      return;
    }
    const swfUrl = `./game/${swfFile}`;
    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://unpkg.com/@nickytwoshoes/ruffle@0.1.0/dist/ruffle.js"></script>
<style>*{margin:0;padding:0}body{background:#000;overflow:hidden}#container{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center}ruffle-embed{width:100%;height:100%}</style>
</head><body>
<div id="container"><ruffle-embed src="${swfUrl}"></ruffle-embed></div>
</body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' https://unpkg.com; frame-ancestors 'self'",
    );
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(html);
    return;
  }

  // DOS games: serve JS-DOS wrapper HTML
  if (gameType === 'dos') {
    const zipFile = findFileWithExtension(media.filePath, '.zip');
    if (!zipFile) {
      res.status(404).json({ success: false, error: 'ZIP file not found in game directory' });
      return;
    }
    const zipUrl = `./game/${zipFile}`;
    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0}body{background:#000;overflow:hidden}#jsdos{width:100vw;height:100vh}</style>
<script src="https://js-dos.com/v7/build/js-dos.js"></script>
<link href="https://js-dos.com/v7/build/js-dos.css" rel="stylesheet">
</head><body>
<div id="jsdos"></div>
<script>
  Dos(document.getElementById("jsdos"), {
    url: "${zipUrl}",
    autoStart: true
  });
</script>
</body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js-dos.com; style-src 'self' 'unsafe-inline' https://js-dos.com; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' https://js-dos.com; frame-ancestors 'self'",
    );
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(html);
    return;
  }

  // HTML games (default): serve files from directory
  const subPath = (req.query.path as string) || 'index.html';
  const safeSub = path.normalize(subPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = path.join(media.filePath, safeSub);

  // Ensure the resolved path is within the game directory (prevent traversal)
  const resolvedDir = path.resolve(media.filePath);
  const resolvedFile = path.resolve(filePath);
  if (!resolvedFile.startsWith(resolvedDir)) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  if (!fs.existsSync(resolvedFile)) {
    res.status(404).json({ success: false, error: 'File not found' });
    return;
  }

  // Set CSP headers to restrict game content
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; frame-ancestors 'self'",
  );
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  res.sendFile(resolvedFile);
});

// ---- GET /api/media/:id/game/:filename — Serve individual game files ----

router.get('/media/:id/game/:filename', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const filename = req.params.filename as string;

  // UUID validation to prevent path traversal
  if (!/^[a-f0-9-]{36}$/.test(id)) {
    res.status(400).json({ success: false, error: 'Invalid media ID format' });
    return;
  }

  // Reject filenames with path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  const media = db.select().from(schema.media).where(eq(schema.media.id, id)).get();
  if (!media) {
    res.status(404).json({ success: false, error: 'Media not found' });
    return;
  }

  if (media.type !== 'game') {
    res.status(400).json({ success: false, error: 'Media is not a game' });
    return;
  }

  const filePath = path.join(media.filePath, filename);

  // Ensure the resolved path is within the game directory (prevent traversal)
  const resolvedDir = path.resolve(media.filePath);
  const resolvedFile = path.resolve(filePath);
  if (!resolvedFile.startsWith(resolvedDir + path.sep) && resolvedFile !== resolvedDir) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  if (!fs.existsSync(resolvedFile) || !fs.statSync(resolvedFile).isFile()) {
    res.status(404).json({ success: false, error: 'File not found' });
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(resolvedFile);
});

// ---- POST /api/media/scan — Trigger scan ----

router.post('/media/scan', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const result = await scanMediaLibrary();
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[media/scan] Error:', err.message);
    res.status(500).json({ success: false, error: 'Scan failed' });
  }
});

export default router;
