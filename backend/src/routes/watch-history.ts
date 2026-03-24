import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { schema } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { AuthRequest } from '../types';
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

// ---- GET /api/watch-history — Get user's watch history ----

router.get('/watch-history', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const status = req.query.status as string | undefined;

    // Build conditions
    const conditions = [eq(schema.watchHistory.userId, userId)];
    // Accept both 'completed' and 'finished' as the same status
    const normalizedStatus = status === 'completed' ? 'finished' : status;
    if (normalizedStatus === 'in_progress' || normalizedStatus === 'finished') {
      conditions.push(eq(schema.watchHistory.status, normalizedStatus));
    }

    // Query watch history with media join
    const rows = db
      .select({
        watchHistory: schema.watchHistory,
        media: schema.media,
      })
      .from(schema.watchHistory)
      .innerJoin(schema.media, eq(schema.watchHistory.mediaId, schema.media.id))
      .where(and(...conditions))
      .orderBy(desc(schema.watchHistory.lastWatchedAt))
      .all();

    const data = rows.map((row) => ({
      ...row.watchHistory,
      media: {
        ...row.media,
        genres: safeJsonParse(row.media.genres),
        keywords: safeJsonParse(row.media.keywords),
      },
    }));

    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[watch-history GET] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch watch history' });
  }
});

// ---- GET /api/watch-history/:mediaId — Get position for specific media ----

router.get('/watch-history/:mediaId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const mediaId = req.params.mediaId as string;
    const episodeId = req.query.episodeId as string | undefined;

    const conditions = [
      eq(schema.watchHistory.userId, userId),
      eq(schema.watchHistory.mediaId, mediaId),
    ];
    if (episodeId) {
      conditions.push(eq(schema.watchHistory.episodeId, episodeId));
    }

    const row = db
      .select()
      .from(schema.watchHistory)
      .where(and(...conditions))
      .get();

    if (!row) {
      res.json({ success: true, data: null });
      return;
    }

    res.json({ success: true, data: row });
  } catch (err: any) {
    console.error('[watch-history/:mediaId GET] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch watch position' });
  }
});

// ---- POST /api/watch-history — Update playback position ----

router.post('/watch-history', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { mediaId, episodeId, positionSeconds, durationSeconds } = req.body;

    // Validate required fields
    if (!mediaId || typeof mediaId !== 'string') {
      res.status(400).json({ success: false, error: 'mediaId is required' });
      return;
    }
    if (typeof positionSeconds !== 'number' || positionSeconds < 0) {
      res.status(400).json({ success: false, error: 'positionSeconds must be a non-negative number' });
      return;
    }
    if (typeof durationSeconds !== 'number' || durationSeconds <= 0) {
      res.status(400).json({ success: false, error: 'durationSeconds must be a positive number' });
      return;
    }

    // Verify media exists
    const mediaRow = db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();
    if (!mediaRow) {
      res.status(404).json({ success: false, error: 'Media not found' });
      return;
    }

    // Calculate percentage
    const percentageWatched = Math.min(100, (positionSeconds / durationSeconds) * 100);

    // Determine status
    let status: string;
    if (percentageWatched >= 90) {
      status = 'finished';
    } else if (percentageWatched >= 5) {
      status = 'in_progress';
    } else {
      // Less than 5%, still save but mark as in_progress
      status = 'in_progress';
    }

    const now = new Date().toISOString();

    // Check for existing entry (same user + media + episode)
    const existingConditions = [
      eq(schema.watchHistory.userId, userId),
      eq(schema.watchHistory.mediaId, mediaId),
    ];
    if (episodeId) {
      existingConditions.push(eq(schema.watchHistory.episodeId, episodeId));
    }

    const existing = db
      .select()
      .from(schema.watchHistory)
      .where(and(...existingConditions))
      .get();

    if (existing) {
      // Update existing entry
      db.update(schema.watchHistory)
        .set({
          positionSeconds: Math.floor(positionSeconds),
          durationSeconds: Math.floor(durationSeconds),
          percentageWatched,
          status,
          lastWatchedAt: now,
        })
        .where(eq(schema.watchHistory.id, existing.id))
        .run();

      const updated = db.select().from(schema.watchHistory).where(eq(schema.watchHistory.id, existing.id)).get();
      res.json({ success: true, data: updated });
    } else {
      // Create new entry
      const newId = crypto.randomUUID();
      db.insert(schema.watchHistory).values({
        id: newId,
        userId,
        mediaId,
        episodeId: episodeId || null,
        positionSeconds: Math.floor(positionSeconds),
        durationSeconds: Math.floor(durationSeconds),
        percentageWatched,
        status,
        lastWatchedAt: now,
      }).run();

      const created = db.select().from(schema.watchHistory).where(eq(schema.watchHistory.id, newId)).get();
      res.status(201).json({ success: true, data: created });
    }
  } catch (err: any) {
    console.error('[watch-history POST] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update watch history' });
  }
});

export default router;
