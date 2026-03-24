import { Router, Response } from 'express';
import crypto from 'crypto';
import { db, sqlite } from '../db';
import { schema } from '../db';
import { eq, and, or, asc } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ---- Helper: strip HTML tags ----

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

// ---- POST /api/comments — Create a timed comment ----

router.post('/comments', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { mediaId, episodeId, timestampSeconds, text } = req.body;

    // Validate required fields
    if (!mediaId || timestampSeconds === undefined || !text) {
      res.status(400).json({ success: false, error: 'mediaId, timestampSeconds, and text are required' });
      return;
    }

    // Validate timestamp
    const ts = parseInt(timestampSeconds, 10);
    if (isNaN(ts) || ts < 0) {
      res.status(400).json({ success: false, error: 'timestampSeconds must be a non-negative integer' });
      return;
    }

    // Validate and sanitize text
    const cleanText = stripHtml(String(text));
    if (cleanText.length === 0 || cleanText.length > 500) {
      res.status(400).json({ success: false, error: 'text must be 1-500 characters' });
      return;
    }

    // Verify media exists
    const mediaRow = db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();
    if (!mediaRow) {
      res.status(404).json({ success: false, error: 'Media not found' });
      return;
    }

    // Verify episode exists if provided
    if (episodeId) {
      const epRow = db.select().from(schema.episodes).where(eq(schema.episodes.id, episodeId)).get();
      if (!epRow) {
        res.status(404).json({ success: false, error: 'Episode not found' });
        return;
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.insert(schema.comments).values({
      id,
      userId,
      mediaId,
      episodeId: episodeId || null,
      timestampSeconds: ts,
      text: cleanText,
      createdAt: now,
    }).run();

    // Fetch the created comment with user info
    const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();

    res.status(201).json({
      success: true,
      data: {
        id,
        userId,
        mediaId,
        episodeId: episodeId || null,
        timestampSeconds: ts,
        text: cleanText,
        createdAt: now,
        user: {
          displayName: user?.displayName || '',
          avatarUrl: user?.avatarUrl || null,
        },
      },
    });
  } catch (err: any) {
    console.error('[comments POST] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create comment' });
  }
});

// ---- GET /api/comments/:mediaId — Get comments for a media item ----

router.get('/comments/:mediaId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const mediaId = req.params.mediaId;
    const episodeId = req.query.episodeId as string | undefined;

    // Get accepted friend IDs (both directions)
    const friendRows = db
      .select()
      .from(schema.friends)
      .where(
        and(
          eq(schema.friends.status, 'accepted'),
          or(
            eq(schema.friends.userId, userId),
            eq(schema.friends.friendId, userId),
          ),
        ),
      )
      .all();

    const friendIds = new Set<string>();
    friendIds.add(userId); // Always include own comments
    for (const row of friendRows) {
      friendIds.add(row.userId === userId ? row.friendId : row.userId);
    }

    // Build query using raw SQL for the IN clause with friend filtering
    const placeholders = Array.from(friendIds).map(() => '?').join(',');
    const params: any[] = [mediaId];

    let query = `
      SELECT c.*, u.display_name, u.avatar_url
      FROM comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.media_id = ?
    `;

    if (episodeId) {
      query += ' AND c.episode_id = ?';
      params.push(episodeId);
    }

    query += ` AND c.user_id IN (${placeholders})`;
    params.push(...Array.from(friendIds));

    query += ' ORDER BY c.timestamp_seconds ASC';

    const rows = sqlite.prepare(query).all(...params) as any[];

    const comments = rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      mediaId: row.media_id,
      episodeId: row.episode_id,
      timestampSeconds: row.timestamp_seconds,
      text: row.text,
      createdAt: row.created_at,
      user: {
        displayName: row.display_name || '',
        avatarUrl: row.avatar_url || null,
      },
    }));

    res.json({ success: true, data: comments });
  } catch (err: any) {
    console.error('[comments GET] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
});

// ---- DELETE /api/comments/:id — Delete own comment ----

router.delete('/comments/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const commentId = req.params.id as string;

    const comment = db.select().from(schema.comments).where(eq(schema.comments.id, commentId)).get();

    if (!comment) {
      res.status(404).json({ success: false, error: 'Comment not found' });
      return;
    }

    if (comment.userId !== userId) {
      res.status(403).json({ success: false, error: 'You can only delete your own comments' });
      return;
    }

    db.delete(schema.comments).where(eq(schema.comments.id, commentId as string)).run();

    res.json({ success: true, data: { deleted: true } });
  } catch (err: any) {
    console.error('[comments DELETE] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
});

export default router;
