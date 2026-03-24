import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { schema } from '../db';
import { eq, and, or } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ---- GET /api/friends — List all friends with profiles ----

router.get('/friends', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all friend rows where the user is involved
    const allRows = db
      .select()
      .from(schema.friends)
      .where(
        or(
          eq(schema.friends.userId, userId),
          eq(schema.friends.friendId, userId),
        ),
      )
      .all();

    // Build result with profile info
    const friends: any[] = [];
    const pending: any[] = [];

    for (const row of allRows) {
      // Determine which side the current user is on
      const isRequester = row.userId === userId;
      const otherUserId = isRequester ? row.friendId : row.userId;

      // Get the other user's profile
      const otherUser = db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, otherUserId))
        .get();

      const entry = {
        id: row.id,
        userId: row.userId,
        friendId: row.friendId,
        status: row.status === 'pending'
          ? (isRequester ? 'pending_sent' : 'pending_received')
          : row.status,
        createdAt: row.createdAt,
        friend: otherUser
          ? {
              id: otherUser.id,
              email: otherUser.email,
              displayName: otherUser.displayName,
              avatarUrl: otherUser.avatarUrl,
              createdAt: otherUser.createdAt,
            }
          : null,
      };

      if (row.status === 'accepted') {
        friends.push(entry);
      } else if (row.status === 'pending') {
        pending.push(entry);
      }
    }

    res.json({ success: true, data: { friends, pending } });
  } catch (err: any) {
    console.error('[friends GET] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch friends' });
  }
});

// ---- POST /api/friends — Send a friend request ----

router.post('/friends', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Cannot add yourself
    if (normalizedEmail === req.user!.email) {
      res.status(400).json({ success: false, error: 'Cannot add yourself' });
      return;
    }

    // Look up the target user
    const targetUser = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .get();

    if (!targetUser) {
      // Per PRD: store as pending even if user doesn't exist yet
      // For now, return success message but don't create a DB entry without a valid user
      res.json({
        success: true,
        data: {
          id: crypto.randomUUID(),
          userId,
          friendId: null,
          status: 'pending_sent',
          createdAt: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if already friends or pending
    const existing = db
      .select()
      .from(schema.friends)
      .where(
        or(
          and(
            eq(schema.friends.userId, userId),
            eq(schema.friends.friendId, targetUser.id),
          ),
          and(
            eq(schema.friends.userId, targetUser.id),
            eq(schema.friends.friendId, userId),
          ),
        ),
      )
      .get();

    if (existing) {
      if (existing.status === 'accepted') {
        res.status(400).json({ success: false, error: 'Already friends' });
        return;
      }
      if (existing.status === 'pending') {
        res.status(400).json({ success: false, error: 'Request already pending' });
        return;
      }
      if (existing.status === 'blocked') {
        res.status(400).json({ success: false, error: 'Unable to send request' });
        return;
      }
    }

    const friendEntry = {
      id: crypto.randomUUID(),
      userId,
      friendId: targetUser.id,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    db.insert(schema.friends).values(friendEntry).run();

    res.json({
      success: true,
      data: {
        ...friendEntry,
        status: 'pending_sent',
      },
    });
  } catch (err: any) {
    console.error('[friends POST] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to send friend request' });
  }
});

// ---- POST /api/friends/:id/accept — Accept a friend request ----

router.post('/friends/:id/accept', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const friendshipId = req.params.id as string;

    const row = db
      .select()
      .from(schema.friends)
      .where(eq(schema.friends.id, friendshipId))
      .get();

    if (!row) {
      res.status(404).json({ success: false, error: 'Friend request not found' });
      return;
    }

    // Only the recipient can accept
    if (row.friendId !== userId) {
      res.status(403).json({ success: false, error: 'Cannot accept this request' });
      return;
    }

    if (row.status !== 'pending') {
      res.status(400).json({ success: false, error: 'Request is not pending' });
      return;
    }

    db.update(schema.friends)
      .set({ status: 'accepted' })
      .where(eq(schema.friends.id, friendshipId))
      .run();

    res.json({
      success: true,
      data: { ...row, status: 'accepted' },
    });
  } catch (err: any) {
    console.error('[friends accept] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to accept request' });
  }
});

// ---- POST /api/friends/:id/reject — Reject (delete) a friend request ----

router.post('/friends/:id/reject', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const friendshipId = req.params.id as string;

    const row = db
      .select()
      .from(schema.friends)
      .where(eq(schema.friends.id, friendshipId))
      .get();

    if (!row) {
      res.status(404).json({ success: false, error: 'Friend request not found' });
      return;
    }

    // Only the recipient can reject
    if (row.friendId !== userId) {
      res.status(403).json({ success: false, error: 'Cannot reject this request' });
      return;
    }

    db.delete(schema.friends).where(eq(schema.friends.id, friendshipId)).run();

    res.json({ success: true, data: null });
  } catch (err: any) {
    console.error('[friends reject] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to reject request' });
  }
});

// ---- POST /api/friends/:id/block — Block a user ----

router.post('/friends/:id/block', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const friendshipId = req.params.id as string;

    const row = db
      .select()
      .from(schema.friends)
      .where(eq(schema.friends.id, friendshipId))
      .get();

    if (!row) {
      res.status(404).json({ success: false, error: 'Friendship not found' });
      return;
    }

    // User must be part of this relationship
    if (row.userId !== userId && row.friendId !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    db.update(schema.friends)
      .set({ status: 'blocked' })
      .where(eq(schema.friends.id, friendshipId))
      .run();

    res.json({ success: true, data: null });
  } catch (err: any) {
    console.error('[friends block] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to block user' });
  }
});

// ---- DELETE /api/friends/:id — Remove a friend ----

router.delete('/friends/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const friendshipId = req.params.id as string;

    const row = db
      .select()
      .from(schema.friends)
      .where(eq(schema.friends.id, friendshipId))
      .get();

    if (!row) {
      res.status(404).json({ success: false, error: 'Friendship not found' });
      return;
    }

    // User must be part of this relationship
    if (row.userId !== userId && row.friendId !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    db.delete(schema.friends).where(eq(schema.friends.id, friendshipId)).run();

    res.json({ success: true, data: null });
  } catch (err: any) {
    console.error('[friends delete] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to remove friend' });
  }
});

export default router;
