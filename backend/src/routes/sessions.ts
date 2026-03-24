import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, schema } from '../db';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// All session routes require auth
router.use('/sessions', authMiddleware);

// POST /api/sessions — Create a watch session
router.post('/sessions', (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { mediaId, episodeId } = req.body as {
      mediaId: string;
      episodeId?: string;
    };

    if (!mediaId) {
      res.status(400).json({ success: false, error: 'mediaId is required' });
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

    const sessionId = uuidv4();
    const now = new Date().toISOString();

    db.insert(schema.watchSessions).values({
      id: sessionId,
      hostId: user.id,
      mediaId,
      episodeId: episodeId || null,
      status: 'active',
      createdAt: now,
    }).run();

    // Add host as participant
    db.insert(schema.watchSessionParticipants).values({
      id: uuidv4(),
      sessionId,
      userId: user.id,
      joinedAt: now,
    }).run();

    res.status(201).json({
      success: true,
      data: {
        sessionId,
        socketRoom: `session:${sessionId}`,
      },
    });
  } catch (err: any) {
    console.error('[POST /sessions] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create session' });
  }
});

// GET /api/sessions/:id — Get session with participants
router.get('/sessions/:id', (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.params.id as string;

    const session = db
      .select()
      .from(schema.watchSessions)
      .where(eq(schema.watchSessions.id, sessionId))
      .get();

    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const participants = db
      .select({
        id: schema.watchSessionParticipants.id,
        userId: schema.watchSessionParticipants.userId,
        joinedAt: schema.watchSessionParticipants.joinedAt,
        displayName: schema.users.displayName,
        avatarUrl: schema.users.avatarUrl,
      })
      .from(schema.watchSessionParticipants)
      .leftJoin(
        schema.users,
        eq(schema.watchSessionParticipants.userId, schema.users.id)
      )
      .where(eq(schema.watchSessionParticipants.sessionId, sessionId))
      .all();

    // Get media info
    const mediaRow = db
      .select()
      .from(schema.media)
      .where(eq(schema.media.id, session.mediaId))
      .get();

    res.json({
      success: true,
      data: {
        ...session,
        participants,
        media: mediaRow
          ? {
              id: mediaRow.id,
              title: mediaRow.title,
              type: mediaRow.type,
              posterUrl: mediaRow.posterUrl,
              durationSeconds: mediaRow.durationSeconds,
            }
          : null,
      },
    });
  } catch (err: any) {
    console.error('[GET /sessions/:id] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch session' });
  }
});

// POST /api/sessions/:id/invite — Invite a friend
router.post('/sessions/:id/invite', (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const sessionId = req.params.id as string;
    const { friendId } = req.body as { friendId: string };

    if (!friendId) {
      res.status(400).json({ success: false, error: 'friendId is required' });
      return;
    }

    // Verify session exists and user is the host
    const session = db
      .select()
      .from(schema.watchSessions)
      .where(
        and(
          eq(schema.watchSessions.id, sessionId),
          eq(schema.watchSessions.hostId, user.id),
          eq(schema.watchSessions.status, 'active')
        )
      )
      .get();

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found or you are not the host',
      });
      return;
    }

    // Verify friendship
    const friendship = db
      .select()
      .from(schema.friends)
      .where(
        and(
          eq(schema.friends.userId, user.id),
          eq(schema.friends.friendId, friendId),
          eq(schema.friends.status, 'accepted')
        )
      )
      .get();

    if (!friendship) {
      res.status(403).json({ success: false, error: 'User is not your friend' });
      return;
    }

    // The actual Socket.io invitation is handled by the frontend
    // emitting to the friend via the socket. This REST endpoint
    // validates the request and returns success.
    res.json({
      success: true,
      data: { sessionId, invitedUserId: friendId },
    });
  } catch (err: any) {
    console.error('[POST /sessions/:id/invite] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to send invitation' });
  }
});

// DELETE /api/sessions/:id — End a session
router.delete('/sessions/:id', (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const sessionId = req.params.id as string;

    const session = db
      .select()
      .from(schema.watchSessions)
      .where(
        and(
          eq(schema.watchSessions.id, sessionId),
          eq(schema.watchSessions.hostId, user.id)
        )
      )
      .get();

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found or you are not the host',
      });
      return;
    }

    db.update(schema.watchSessions)
      .set({ status: 'ended' })
      .where(eq(schema.watchSessions.id, sessionId))
      .run();

    res.json({ success: true, data: null });
  } catch (err: any) {
    console.error('[DELETE /sessions/:id] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to end session' });
  }
});

export default router;
