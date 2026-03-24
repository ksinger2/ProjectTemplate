import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { schema } from '../db';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ---- POST /api/ratings — Rate a media item ----

router.post('/ratings', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { mediaId, rating } = req.body;

    // Validate mediaId
    if (!mediaId || typeof mediaId !== 'string') {
      res.status(400).json({ success: false, error: 'mediaId is required' });
      return;
    }

    // Validate rating value
    if (rating !== 'up' && rating !== 'down' && rating !== null) {
      res.status(400).json({ success: false, error: "rating must be 'up', 'down', or null" });
      return;
    }

    // Verify media exists
    const mediaRow = db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();
    if (!mediaRow) {
      res.status(404).json({ success: false, error: 'Media not found' });
      return;
    }

    // Convert rating to numeric: up = 1, down = -1, null = remove
    const ratingValue = rating === 'up' ? 1 : rating === 'down' ? -1 : null;

    // Find existing rating
    const existing = db
      .select()
      .from(schema.userRatings)
      .where(and(
        eq(schema.userRatings.userId, userId),
        eq(schema.userRatings.mediaId, mediaId),
      ))
      .get();

    if (ratingValue === null) {
      // Remove rating
      if (existing) {
        db.delete(schema.userRatings).where(eq(schema.userRatings.id, existing.id)).run();
      }
      res.json({ success: true, data: { mediaId, rating: 0 } });
      return;
    }

    if (existing) {
      // Update existing rating
      db.update(schema.userRatings)
        .set({ rating: ratingValue, createdAt: new Date().toISOString() })
        .where(eq(schema.userRatings.id, existing.id))
        .run();
    } else {
      // Create new rating
      db.insert(schema.userRatings).values({
        id: crypto.randomUUID(),
        userId,
        mediaId,
        rating: ratingValue,
        createdAt: new Date().toISOString(),
      }).run();
    }

    res.json({ success: true, data: { mediaId, rating: ratingValue } });
  } catch (err: any) {
    console.error('[ratings POST] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save rating' });
  }
});

// ---- GET /api/ratings/:mediaId — Get user's rating for a specific media ----

router.get('/ratings/:mediaId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const mediaId = req.params.mediaId as string;

    const existing = db
      .select()
      .from(schema.userRatings)
      .where(and(
        eq(schema.userRatings.userId, userId),
        eq(schema.userRatings.mediaId, mediaId),
      ))
      .get();

    res.json({
      success: true,
      data: { mediaId, rating: existing ? existing.rating : 0 },
    });
  } catch (err: any) {
    console.error('[ratings GET] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch rating' });
  }
});

export default router;
