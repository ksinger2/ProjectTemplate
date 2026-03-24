import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { schema } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { authMiddleware } from '../middleware/auth';

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

// Helper: compute overlap score between two arrays
function overlapScore(a: string[], b: string[]): number {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((item) => setB.has(item.toLowerCase())).length;
}

// ---- GET /api/recommendations — Personalized recommendations ----

router.get('/recommendations', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // 1. Get user's watch history
    const watchedItems = db
      .select()
      .from(schema.watchHistory)
      .where(eq(schema.watchHistory.userId, userId))
      .all();

    const watchedMediaIds = new Set(watchedItems.map((w) => w.mediaId));

    // 2. Get user's liked items (rating = 1)
    const likedRatings = db
      .select()
      .from(schema.userRatings)
      .where(
        and(
          eq(schema.userRatings.userId, userId),
          eq(schema.userRatings.rating, 1),
        ),
      )
      .all();

    const likedMediaIds = likedRatings.map((r) => r.mediaId);

    // 3. Get all media
    const allMedia = db.select().from(schema.media).all();

    // Cold start: no history or ratings, return recently added
    if (watchedItems.length === 0 && likedRatings.length === 0) {
      const recent = allMedia
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 20)
        .map(formatMedia);

      res.json({ success: true, data: recent });
      return;
    }

    // 4. Gather preferred genres and keywords from liked + watched items
    const preferredGenres: string[] = [];
    const preferredKeywords: string[] = [];

    for (const m of allMedia) {
      if (likedMediaIds.includes(m.id) || watchedMediaIds.has(m.id)) {
        preferredGenres.push(...parseJsonArray(m.genres));
        preferredKeywords.push(...parseJsonArray(m.keywords));
      }
    }

    // 5. Score all unwatched media
    const scored = allMedia
      .filter((m) => !watchedMediaIds.has(m.id))
      .map((m) => {
        const genres = parseJsonArray(m.genres);
        const keywords = parseJsonArray(m.keywords);

        const genreScore = overlapScore(genres, preferredGenres) * 3;
        const keywordScore = overlapScore(keywords, preferredKeywords) * 2;

        // Recency bonus: items added in last 30 days get +1
        const ageMs =
          Date.now() - new Date(m.createdAt).getTime();
        const recencyBonus = ageMs < 30 * 24 * 60 * 60 * 1000 ? 1 : 0;

        const totalScore = genreScore + keywordScore + recencyBonus;

        return { media: m, score: totalScore };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    res.json({
      success: true,
      data: scored.map((s) => formatMedia(s.media)),
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
      const sourceMediaId = req.params.mediaId;

      // Get the source media
      const sourceMedia = db
        .select()
        .from(schema.media)
        .where(eq(schema.media.id, sourceMediaId))
        .get();

      if (!sourceMedia) {
        res.status(404).json({ success: false, error: 'Media not found' });
        return;
      }

      const sourceGenres = parseJsonArray(sourceMedia.genres);
      const sourceKeywords = parseJsonArray(sourceMedia.keywords);

      // Get watched items to exclude
      const watchedItems = db
        .select()
        .from(schema.watchHistory)
        .where(eq(schema.watchHistory.userId, userId))
        .all();
      const watchedMediaIds = new Set(watchedItems.map((w) => w.mediaId));

      // Get all media and score by similarity
      const allMedia = db.select().from(schema.media).all();

      const scored = allMedia
        .filter(
          (m) => m.id !== sourceMediaId && !watchedMediaIds.has(m.id),
        )
        .map((m) => {
          const genres = parseJsonArray(m.genres);
          const keywords = parseJsonArray(m.keywords);

          const genreScore = overlapScore(genres, sourceGenres) * 3;
          const keywordScore = overlapScore(keywords, sourceKeywords) * 2;

          return { media: m, score: genreScore + keywordScore };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      res.json({
        success: true,
        data: scored.map((s) => formatMedia(s.media)),
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

export default router;
