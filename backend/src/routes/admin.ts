import { Router, Request, Response } from 'express';
import { db, sqlite } from '../db';
import { schema } from '../db';
import { eq, asc, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ---- Helper to parse JSON array fields ----

function safeJsonParse(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseMedia(row: typeof schema.media.$inferSelect) {
  const { filePath, ...rest } = row;
  return {
    ...rest,
    genres: safeJsonParse(row.genres),
    keywords: safeJsonParse(row.keywords),
  };
}

// ---- GET /api/admin/media — List all media for admin ----

router.get('/admin/media', authMiddleware, (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 50));

    // Get total count
    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.media)
      .get();

    const total = countResult?.count || 0;

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const rows = db
      .select()
      .from(schema.media)
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
    console.error('[admin/media] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch media' });
  }
});

// ---- PATCH /api/admin/media/:id — Update media metadata ----

router.patch('/admin/media/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, description, genres, keywords, year, posterUrl } = req.body;

    // Verify media exists
    const existing = db.select().from(schema.media).where(eq(schema.media.id, id)).get();

    if (!existing) {
      res.status(404).json({ success: false, error: 'Media not found' });
      return;
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (year !== undefined) updates.year = year;
    if (posterUrl !== undefined) updates.posterUrl = posterUrl;
    if (genres !== undefined) updates.genres = JSON.stringify(genres);
    if (keywords !== undefined) updates.keywords = JSON.stringify(keywords);

    db.update(schema.media).set(updates).where(eq(schema.media.id, id)).run();

    // Re-index in FTS
    const updatedRow = db.select().from(schema.media).where(eq(schema.media.id, id as string)).get();

    if (updatedRow) {
      const parsedGenres = safeJsonParse(updatedRow.genres);
      const parsedKeywords = safeJsonParse(updatedRow.keywords);

      // Update FTS
      sqlite.prepare('DELETE FROM media_fts WHERE media_id = ?').run(id);
      sqlite.prepare(
        'INSERT INTO media_fts (media_id, title, description, genres, keywords) VALUES (?, ?, ?, ?, ?)'
      ).run(
        id,
        updatedRow.title,
        updatedRow.description || '',
        parsedGenres.join(' '),
        parsedKeywords.join(' ')
      );

      res.json({ success: true, data: parseMedia(updatedRow) });
    } else {
      res.status(500).json({ success: false, error: 'Failed to retrieve updated media' });
    }
  } catch (err: any) {
    console.error('[admin/media/:id] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update media' });
  }
});

// ---- PATCH /api/admin/episodes/:id — Update episode intro markers ----

router.patch('/admin/episodes/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { introStart, introEnd } = req.body;

    // Verify episode exists
    const existing = db.select().from(schema.episodes).where(eq(schema.episodes.id, id)).get();

    if (!existing) {
      res.status(404).json({ success: false, error: 'Episode not found' });
      return;
    }

    // Validate types if provided
    if (introStart !== undefined && (typeof introStart !== 'number' || introStart < 0)) {
      res.status(400).json({ success: false, error: 'introStart must be a non-negative integer' });
      return;
    }
    if (introEnd !== undefined && (typeof introEnd !== 'number' || introEnd < 0)) {
      res.status(400).json({ success: false, error: 'introEnd must be a non-negative integer' });
      return;
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {};
    if (introStart !== undefined) updates.introStart = introStart;
    if (introEnd !== undefined) updates.introEnd = introEnd;

    if (Object.keys(updates).length === 0) {
      res.json({ success: true, data: existing });
      return;
    }

    db.update(schema.episodes).set(updates).where(eq(schema.episodes.id, id)).run();

    const updatedRow = db.select().from(schema.episodes).where(eq(schema.episodes.id, id)).get();
    res.json({ success: true, data: updatedRow });
  } catch (err: any) {
    console.error('[admin/episodes/:id] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update episode' });
  }
});

export default router;
