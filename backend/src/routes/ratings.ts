import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { schema } from '../db';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ---- POST /api/ratings — Upsert a rating (like/dislike) ----

router.post('/ratings', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { mediaId, rating } = req.body;

    // Validate mediaId
    if (!mediaId || typeof mediaId !== 'string') {
      res.status(400).json({ success: false, error: 'mediaId is required' });
      return;
    }

    // Accept 'like', 'dislike', 'up', 'down' for flexibility
    const validRatings = ['like', 'dislike', 'up', 'down'];
    if (!validRatings.includes(rating)) {
      res.status(400).json({ success: false, error: "rating must be 'like' or 'dislike'" });
      return;
    }

    // Verify media exists
    const mediaRow = db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();
    if (!mediaRow) {
      res.status(404).json({ success: false, error: 'Media not found' });
      return;
    }

    // Convert to numeric: like/up = 1, dislike/down = -1
    const ratingValue = (rating === 'like' || rating === 'up') ? 1 : -1;

    // Find existing rating
    const existing = db
      .select()
      .from(schema.userRatings)
      .where(and(
        eq(schema.userRatings.userId, userId),
        eq(schema.userRatings.mediaId, mediaId),
      ))
      .get();

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

    res.json({
      success: true,
      data: {
        mediaId,
        rating: ratingValue === 1 ? 'like' : 'dislike',
        ratingValue,
      },
    });
  } catch (err: any) {
    console.error('[ratings POST] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save rating' });
  }
});

// ---- GET /api/ratings — Get all ratings for the current user ----

router.get('/ratings', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const rows = db
      .select()
      .from(schema.userRatings)
      .where(eq(schema.userRatings.userId, userId))
      .all();

    const data = rows.map((r) => ({
      mediaId: r.mediaId,
      rating: r.rating === 1 ? 'like' : 'dislike',
      ratingValue: r.rating,
      createdAt: r.createdAt,
    }));

    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[ratings GET] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch ratings' });
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

    if (!existing) {
      res.json({ success: true, data: { mediaId, rating: null, ratingValue: 0 } });
      return;
    }

    res.json({
      success: true,
      data: {
        mediaId,
        rating: existing.rating === 1 ? 'like' : 'dislike',
        ratingValue: existing.rating,
      },
    });
  } catch (err: any) {
    console.error('[ratings GET :mediaId] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch rating' });
  }
});

// ---- DELETE /api/ratings/:mediaId — Remove a rating ----

router.delete('/ratings/:mediaId', authMiddleware, (req: AuthRequest, res: Response) => {
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

    if (existing) {
      db.delete(schema.userRatings).where(eq(schema.userRatings.id, existing.id)).run();
    }

    res.json({ success: true, data: { mediaId, rating: null, ratingValue: 0 } });
  } catch (err: any) {
    console.error('[ratings DELETE] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to remove rating' });
  }
});

export default router;
