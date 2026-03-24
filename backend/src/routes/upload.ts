import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { db, sqlite } from '../db';
import { schema } from '../db';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const MEDIA_PATH = process.env.MEDIA_PATH
  ? path.resolve(process.env.MEDIA_PATH)
  : path.join(PROJECT_ROOT, 'media');
const DATA_PATH = process.env.DATA_PATH
  ? path.resolve(process.env.DATA_PATH)
  : path.join(PROJECT_ROOT, 'data');
const THUMBNAILS_PATH = path.join(DATA_PATH, 'thumbnails');

// ---- Helpers ----

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._\-() ]/g, '_').replace(/\.{2,}/g, '.');
}

function sanitizeDirName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-() ]/g, '_').replace(/\.{2,}/g, '.');
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function safeJsonParse(val: string | undefined): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function upsertFts(mediaId: string, title: string, description: string | null, genres: string[], keywords: string[]): void {
  sqlite.prepare('DELETE FROM media_fts WHERE media_id = ?').run(mediaId);
  sqlite.prepare(
    'INSERT INTO media_fts (media_id, title, description, genres, keywords) VALUES (?, ?, ?, ?, ?)'
  ).run(
    mediaId,
    title,
    description || '',
    genres.join(', '),
    keywords.join(', ')
  );
}

// ---- Multer configs ----

// Media files: up to 5GB, stored to temp then moved
const mediaUpload = multer({
  limits: { fileSize: 5 * 1024 * 1024 * 1024, files: 1 },
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const tmpDir = path.join(DATA_PATH, 'tmp-uploads');
      ensureDir(tmpDir);
      cb(null, tmpDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
});

// Poster images: up to 10MB
const posterUpload = multer({
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDir(THUMBNAILS_PATH);
      cb(null, THUMBNAILS_PATH);
    },
    filename: (req: any, _file, cb) => {
      const mediaId = req.params.mediaId;
      cb(null, `${mediaId}.jpg`);
    },
  }),
});

// Game files: up to 100MB
const gameUpload = multer({
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const tmpDir = path.join(DATA_PATH, 'tmp-uploads');
      ensureDir(tmpDir);
      cb(null, tmpDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
});

// ---- POST /api/upload/media — Upload a media file ----

router.post(
  '/upload/media',
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    mediaUpload.single('file')(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ success: false, error: 'File must be under 5GB' });
          return;
        }
        res.status(400).json({ success: false, error: err.message || 'Upload failed' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      try {
        const { type, title, description, genres, keywords, year, artist, album, showName, season } = req.body;

        // Validate required fields
        if (!type || !title) {
          // Clean up temp file
          fs.unlinkSync(req.file.path);
          res.status(400).json({ success: false, error: 'type and title are required' });
          return;
        }

        const validTypes = ['movie', 'show', 'music', 'game'];
        if (!validTypes.includes(type)) {
          fs.unlinkSync(req.file.path);
          res.status(400).json({ success: false, error: 'type must be one of: movie, show, music, game' });
          return;
        }

        const cleanTitle = stripHtml(title);
        const cleanDesc = description ? stripHtml(description) : null;
        const parsedGenres = safeJsonParse(genres);
        const parsedKeywords = safeJsonParse(keywords);
        const parsedYear = year ? parseInt(year, 10) : null;
        const ext = path.extname(req.file.originalname);
        const safeFilename = sanitizeFilename(req.file.originalname);

        let destDir: string;
        let filePath: string;

        if (type === 'movie') {
          const dirName = parsedYear ? `${sanitizeDirName(cleanTitle)} (${parsedYear})` : sanitizeDirName(cleanTitle);
          destDir = path.join(MEDIA_PATH, 'movies', dirName);
          filePath = path.join(destDir, safeFilename);
        } else if (type === 'music') {
          const safeArtist = sanitizeDirName(artist || 'Unknown Artist');
          const safeAlbum = sanitizeDirName(album || 'Unknown Album');
          destDir = path.join(MEDIA_PATH, 'music', safeArtist, safeAlbum);
          filePath = path.join(destDir, safeFilename);
        } else if (type === 'show') {
          const safeShow = sanitizeDirName(showName || cleanTitle);
          const seasonNum = parseInt(season, 10) || 1;
          const seasonDir = `Season ${String(seasonNum).padStart(2, '0')}`;
          destDir = path.join(MEDIA_PATH, 'shows', safeShow, seasonDir);
          filePath = path.join(destDir, safeFilename);
        } else {
          // game — handled by /upload/game, but allow fallback
          destDir = path.join(MEDIA_PATH, 'games', sanitizeDirName(cleanTitle));
          filePath = path.join(destDir, safeFilename);
        }

        // Path traversal protection
        const resolvedDest = path.resolve(filePath);
        if (!resolvedDest.startsWith(path.resolve(MEDIA_PATH))) {
          fs.unlinkSync(req.file.path);
          res.status(400).json({ success: false, error: 'Invalid file path' });
          return;
        }

        // Move file from temp to final destination
        ensureDir(destDir);
        fs.renameSync(req.file.path, filePath);

        // Create media entry
        const id = uuidv4();
        const now = new Date().toISOString();

        db.insert(schema.media).values({
          id,
          title: cleanTitle,
          type,
          description: cleanDesc,
          year: parsedYear,
          genres: JSON.stringify(parsedGenres),
          keywords: JSON.stringify(parsedKeywords),
          filePath,
          createdAt: now,
          updatedAt: now,
        }).run();

        // Update FTS
        upsertFts(id, cleanTitle, cleanDesc, parsedGenres, parsedKeywords);

        const created = db.select().from(schema.media).where(eq(schema.media.id, id)).get();

        res.status(201).json({
          success: true,
          data: {
            ...created,
            genres: parsedGenres,
            keywords: parsedKeywords,
          },
        });
      } catch (innerErr: any) {
        console.error('[upload/media] Error:', innerErr.message);
        // Clean up temp file if it still exists
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, error: 'Failed to upload media' });
      }
    });
  }
);

// ---- POST /api/upload/poster/:mediaId — Upload poster image ----

router.post(
  '/upload/poster/:mediaId',
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    const mediaId = req.params.mediaId as string;

    // UUID validation
    if (!/^[a-f0-9-]{36}$/.test(mediaId)) {
      res.status(400).json({ success: false, error: 'Invalid media ID format' });
      return;
    }

    // Verify media exists
    const mediaRow = db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();
    if (!mediaRow) {
      res.status(404).json({ success: false, error: 'Media not found' });
      return;
    }

    posterUpload.single('file')(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ success: false, error: 'Image must be under 10MB' });
          return;
        }
        res.status(400).json({ success: false, error: err.message || 'Upload failed' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      try {
        const posterUrl = `/api/media/${mediaId}/thumbnail`;

        db.update(schema.media)
          .set({ posterUrl, updatedAt: new Date().toISOString() })
          .where(eq(schema.media.id, mediaId))
          .run();

        const updated = db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();

        res.json({
          success: true,
          data: {
            ...updated,
            genres: safeJsonParse(updated!.genres),
            keywords: safeJsonParse(updated!.keywords),
          },
        });
      } catch (innerErr: any) {
        console.error('[upload/poster] Error:', innerErr.message);
        res.status(500).json({ success: false, error: 'Failed to save poster' });
      }
    });
  }
);

// ---- POST /api/upload/game — Upload a game file ----

router.post(
  '/upload/game',
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    gameUpload.single('file')(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ success: false, error: 'Game file must be under 100MB' });
          return;
        }
        res.status(400).json({ success: false, error: err.message || 'Upload failed' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      try {
        const { title, description, gameType } = req.body;

        if (!title) {
          fs.unlinkSync(req.file.path);
          res.status(400).json({ success: false, error: 'title is required' });
          return;
        }

        const validGameTypes = ['html', 'flash', 'dos'];
        const resolvedGameType = validGameTypes.includes(gameType) ? gameType : 'html';

        const cleanTitle = stripHtml(title);
        const cleanDesc = description ? stripHtml(description) : null;
        const safeDirName = sanitizeDirName(cleanTitle);
        const destDir = path.join(MEDIA_PATH, 'games', safeDirName);

        // Path traversal protection
        if (!path.resolve(destDir).startsWith(path.resolve(MEDIA_PATH))) {
          fs.unlinkSync(req.file.path);
          res.status(400).json({ success: false, error: 'Invalid file path' });
          return;
        }

        ensureDir(destDir);

        const safeFilename = sanitizeFilename(req.file.originalname);
        const destPath = path.join(destDir, safeFilename);

        fs.renameSync(req.file.path, destPath);

        const id = uuidv4();
        const now = new Date().toISOString();

        db.insert(schema.media).values({
          id,
          title: cleanTitle,
          type: 'game',
          description: cleanDesc,
          genres: '[]',
          keywords: '[]',
          filePath: destDir,
          gameType: resolvedGameType,
          createdAt: now,
          updatedAt: now,
        }).run();

        // Update FTS
        upsertFts(id, cleanTitle, cleanDesc, [], []);

        const created = db.select().from(schema.media).where(eq(schema.media.id, id)).get();

        res.status(201).json({
          success: true,
          data: {
            ...created,
            genres: [],
            keywords: [],
          },
        });
      } catch (innerErr: any) {
        console.error('[upload/game] Error:', innerErr.message);
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, error: 'Failed to upload game' });
      }
    });
  }
);

export default router;
