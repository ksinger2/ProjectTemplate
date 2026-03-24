import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db, sqlite } from '../db';
import { schema } from '../db';
import { eq, and, like, sql, asc } from 'drizzle-orm';
import { scanMediaLibrary } from '../services/media-scanner';

const router = Router();

const DATA_PATH = path.resolve(__dirname, '../../../', process.env.DATA_PATH || '../data');
const THUMBNAILS_PATH = path.join(DATA_PATH, 'thumbnails');

// ---- Helper to parse JSON array fields ----

function parseMedia(row: typeof schema.media.$inferSelect) {
  return {
    ...row,
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

router.get('/media/search', (req: Request, res: Response) => {
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
      INNER JOIN media_fts fts ON fts.rowid = m.rowid
      WHERE media_fts MATCH ?
      LIMIT 50
    `).all(ftsQuery) as Array<typeof schema.media.$inferSelect>;

    const results = rows.map(parseMedia);

    res.json({ success: true, data: results });
  } catch (err: any) {
    console.error('[media/search] Error:', err.message);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// ---- GET /api/media — List media with filters ----

router.get('/media', (req: Request, res: Response) => {
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

router.get('/media/:id/thumbnail', (req: Request, res: Response) => {
  const id = req.params.id as string;
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

router.get('/media/:id', (req: Request, res: Response) => {
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

// ---- POST /api/media/scan — Trigger scan ----

router.post('/media/scan', async (_req: Request, res: Response) => {
  try {
    const result = await scanMediaLibrary();
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[media/scan] Error:', err.message);
    res.status(500).json({ success: false, error: 'Scan failed' });
  }
});

export default router;
