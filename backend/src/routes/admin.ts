import { Router, Request, Response } from 'express';
import { db, sqlite } from '../db';
import { schema } from '../db';
import { eq } from 'drizzle-orm';

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
  return {
    ...row,
    genres: safeJsonParse(row.genres),
    keywords: safeJsonParse(row.keywords),
  };
}

// ---- GET /api/admin/media — List all media for admin ----

router.get('/admin/media', (_req: Request, res: Response) => {
  try {
    const rows = db.select().from(schema.media).all();
    const items = rows.map(parseMedia);

    res.json({ success: true, data: items });
  } catch (err: any) {
    console.error('[admin/media] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch media' });
  }
});

// ---- PATCH /api/admin/media/:id — Update media metadata ----

router.patch('/admin/media/:id', (req: Request, res: Response) => {
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

export default router;
