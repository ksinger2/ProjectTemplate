import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { schema } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { authMiddleware } from '../middleware/auth';
import { getRecommendations, getBecauseYouWatched } from '../services/recommender';

const router = Router();

// Helper: parse JSON array from text column safely
function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Helper: format media row for API response
function formatMedia(m: any) {
  return {
    id: m.id,
    title: m.title,
    type: m.type,
    posterUrl: m.posterUrl,
    description: m.description,
    year: m.year,
    genres: parseJsonArray(m.genres),
    keywords: parseJsonArray(m.keywords),
    durationSeconds: m.durationSeconds,
    filePath: m.filePath,
    codec: m.codec,
    resolution: m.resolution,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

// ---- GET /api/recommendations — Personalized recommendations ----

router.get('/recommendations', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const results = getRecommendations(userId);

    res.json({
      success: true,
      data: results,
    });
  } catch (err: any) {
    console.error('[recommendations GET] Error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations',
    });
  }
});

// ---- GET /api/recommendations/because/:mediaId — "Because you watched X" ----

router.get(
  '/recommendations/because/:mediaId',
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const sourceMediaId = req.params.mediaId as string;

      const results = getBecauseYouWatched(userId, sourceMediaId);

      if (results === null) {
        res.status(404).json({ success: false, error: 'Media not found' });
        return;
      }

      res.json({
        success: true,
        data: results,
      });
    } catch (err: any) {
      console.error('[recommendations because] Error:', err.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recommendations',
      });
    }
  },
);

// ---- POST /api/recommendations/share — Share a recommendation to a friend ----

router.post(
  '/recommendations/share',
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { mediaId, toUserId, message } = req.body;

      if (!mediaId || typeof mediaId !== 'string') {
        res
          .status(400)
          .json({ success: false, error: 'mediaId is required' });
        return;
      }

      if (!toUserId || typeof toUserId !== 'string') {
        res
          .status(400)
          .json({ success: false, error: 'toUserId is required' });
        return;
      }

      // Verify media exists
      const mediaRow = db
        .select()
        .from(schema.media)
        .where(eq(schema.media.id, mediaId))
        .get();
      if (!mediaRow) {
        res.status(404).json({ success: false, error: 'Media not found' });
        return;
      }

      // Verify target user exists
      const targetUser = db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, toUserId))
        .get();
      if (!targetUser) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      // Sanitize message
      const sanitizedMessage = message
        ? String(message).replace(/<[^>]*>/g, '').slice(0, 280)
        : null;

      const rec = {
        id: crypto.randomUUID(),
        fromUserId: userId,
        toUserId,
        mediaId,
        message: sanitizedMessage,
        seen: false,
        createdAt: new Date().toISOString(),
      };

      db.insert(schema.recommendations).values(rec).run();

      res.json({ success: true, data: rec });
    } catch (err: any) {
      console.error('[recommendations share] Error:', err.message);
      res.status(500).json({
        success: false,
        error: 'Failed to share recommendation',
      });
    }
  },
);

// ---- GET /api/recommendations/inbox — Incoming recommendations ----

router.get(
  '/recommendations/inbox',
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      const recs = db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.toUserId, userId))
        .orderBy(desc(schema.recommendations.createdAt))
        .all();

      // Enrich with sender profile and media details
      const enriched = recs.map((rec) => {
        const fromUser = db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, rec.fromUserId))
          .get();

        const mediaRow = db
          .select()
          .from(schema.media)
          .where(eq(schema.media.id, rec.mediaId))
          .get();

        return {
          id: rec.id,
          fromUserId: rec.fromUserId,
          toUserId: rec.toUserId,
          mediaId: rec.mediaId,
          message: rec.message,
          isRead: rec.seen,
          createdAt: rec.createdAt,
          fromUser: fromUser
            ? {
                id: fromUser.id,
                email: fromUser.email,
                displayName: fromUser.displayName,
                avatarUrl: fromUser.avatarUrl,
                createdAt: fromUser.createdAt,
              }
            : null,
          media: mediaRow ? formatMedia(mediaRow) : null,
        };
      });

      res.json({ success: true, data: enriched });
    } catch (err: any) {
      console.error('[recommendations inbox] Error:', err.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch inbox',
      });
    }
  },
);

export default router;
