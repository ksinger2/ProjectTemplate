import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db, schema } from '../db';
import { eq, and } from 'drizzle-orm';

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

interface SocketWithUser extends Socket {
  data: {
    user: AuthUser;
    sessionId?: string;
  };
}

// Track emoji rate limits: userId -> last emoji timestamp
const emojiRateLimits = new Map<string, number>();

// Track cleanup timers for sessions when all participants disconnect
const cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

const DEV_USER: AuthUser = {
  id: 'dev-user-001',
  email: 'dev@blockbuster.local',
  displayName: 'Dev User',
};

export function setupWatchSessionHandlers(io: SocketServer): void {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const skipAuth =
      process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production';

    if (skipAuth) {
      (socket as SocketWithUser).data = { user: DEV_USER };
      return next();
    }

    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return next(new Error('Authentication required'));
      }

      const tokenMatch = cookies.match(/(?:^|;\s*)token=([^;]+)/);
      if (!tokenMatch) {
        return next(new Error('Authentication required'));
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(tokenMatch[1], secret, {
        algorithms: ['HS256'],
      }) as AuthUser;

      (socket as SocketWithUser).data = {
        user: {
          id: decoded.id,
          email: decoded.email,
          displayName: decoded.displayName,
        },
      };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as SocketWithUser;
    const user = socket.data.user;

    console.log(`[socket] Authenticated: ${user.displayName} (${socket.id})`);

    // --- session:create ---
    socket.on(
      'session:create',
      async (
        payload: { mediaId: string; episodeId?: string },
        callback?: (response: { success: boolean; data?: any; error?: string }) => void
      ) => {
        try {
          const { mediaId, episodeId } = payload;

          // Verify media exists
          const mediaRow = db
            .select()
            .from(schema.media)
            .where(eq(schema.media.id, mediaId))
            .get();

          if (!mediaRow) {
            callback?.({ success: false, error: 'Media not found' });
            return;
          }

          const sessionId = uuidv4();
          const now = new Date().toISOString();

          // Create session
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

          // Join socket room
          const room = `session:${sessionId}`;
          socket.join(room);
          socket.data.sessionId = sessionId;

          callback?.({
            success: true,
            data: {
              sessionId,
              socketRoom: room,
              media: {
                id: mediaRow.id,
                title: mediaRow.title,
                type: mediaRow.type,
                posterUrl: mediaRow.posterUrl,
                durationSeconds: mediaRow.durationSeconds,
              },
            },
          });

          console.log(`[session] Created ${sessionId} by ${user.displayName}`);
        } catch (err: any) {
          console.error('[session:create] Error:', err.message);
          callback?.({ success: false, error: 'Failed to create session' });
        }
      }
    );

    // --- session:join ---
    socket.on(
      'session:join',
      async (
        payload: { sessionId: string },
        callback?: (response: { success: boolean; data?: any; error?: string }) => void
      ) => {
        try {
          const { sessionId } = payload;

          const session = db
            .select()
            .from(schema.watchSessions)
            .where(
              and(
                eq(schema.watchSessions.id, sessionId),
                eq(schema.watchSessions.status, 'active')
              )
            )
            .get();

          if (!session) {
            callback?.({ success: false, error: 'Session not found or ended' });
            return;
          }

          // Check participant count (max 2)
          const participants = db
            .select()
            .from(schema.watchSessionParticipants)
            .where(eq(schema.watchSessionParticipants.sessionId, sessionId))
            .all();

          if (participants.length >= 2) {
            callback?.({ success: false, error: 'Session is full (max 2 participants)' });
            return;
          }

          // Check not already a participant
          const alreadyJoined = participants.some((p) => p.userId === user.id);
          if (!alreadyJoined) {
            db.insert(schema.watchSessionParticipants).values({
              id: uuidv4(),
              sessionId,
              userId: user.id,
              joinedAt: new Date().toISOString(),
            }).run();
          }

          // Cancel any pending cleanup timer
          const timer = cleanupTimers.get(sessionId);
          if (timer) {
            clearTimeout(timer);
            cleanupTimers.delete(sessionId);
          }

          const room = `session:${sessionId}`;
          socket.join(room);
          socket.data.sessionId = sessionId;

          // Notify others
          socket.to(room).emit('session:joined', {
            userId: user.id,
            displayName: user.displayName,
          });

          // Get media info
          const mediaRow = db
            .select()
            .from(schema.media)
            .where(eq(schema.media.id, session.mediaId))
            .get();

          callback?.({
            success: true,
            data: {
              sessionId,
              socketRoom: room,
              hostId: session.hostId,
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

          console.log(`[session] ${user.displayName} joined ${sessionId}`);
        } catch (err: any) {
          console.error('[session:join] Error:', err.message);
          callback?.({ success: false, error: 'Failed to join session' });
        }
      }
    );

    // --- session:leave ---
    socket.on('session:leave', () => {
      handleLeave(io, socket);
    });

    // --- sync:play ---
    socket.on('sync:play', () => {
      const sessionId = socket.data.sessionId;
      if (!sessionId) return;
      socket.to(`session:${sessionId}`).emit('sync:play');
    });

    // --- sync:pause ---
    socket.on('sync:pause', () => {
      const sessionId = socket.data.sessionId;
      if (!sessionId) return;
      socket.to(`session:${sessionId}`).emit('sync:pause');
    });

    // --- sync:seek ---
    socket.on('sync:seek', (payload: { position: number }) => {
      const sessionId = socket.data.sessionId;
      if (!sessionId) return;
      socket.to(`session:${sessionId}`).emit('sync:seek', { position: payload.position });
    });

    // --- sync:heartbeat ---
    socket.on('sync:heartbeat', (payload: { position: number }) => {
      const sessionId = socket.data.sessionId;
      if (!sessionId) return;

      // Broadcast heartbeat to host for drift detection
      socket.to(`session:${sessionId}`).emit('sync:heartbeat', {
        userId: user.id,
        position: payload.position,
      });
    });

    // --- emoji:send ---
    socket.on('emoji:send', (payload: { emoji: string }) => {
      const sessionId = socket.data.sessionId;
      if (!sessionId) return;

      // Rate limit: 1 per second per user
      const now = Date.now();
      const lastSent = emojiRateLimits.get(user.id) || 0;
      if (now - lastSent < 1000) {
        return; // Silently drop
      }
      emojiRateLimits.set(user.id, now);

      // Broadcast to room (including sender)
      io.to(`session:${sessionId}`).emit('emoji:receive', {
        emoji: payload.emoji,
        userId: user.id,
        displayName: user.displayName,
        timestamp: now,
      });
    });

    // --- disconnect ---
    socket.on('disconnect', () => {
      handleLeave(io, socket);
    });
  });
}

function handleLeave(io: SocketServer, socket: SocketWithUser): void {
  const sessionId = socket.data.sessionId;
  if (!sessionId) return;

  const user = socket.data.user;
  const room = `session:${sessionId}`;

  socket.leave(room);
  socket.data.sessionId = undefined;

  // Notify remaining participants
  socket.to(room).emit('session:participant-left', { userId: user.id });

  // Check if the session room is now empty
  const roomSockets = io.sockets.adapter.rooms.get(room);
  const remaining = roomSockets ? roomSockets.size : 0;

  if (remaining === 0) {
    // Start 30s cleanup timer
    const timer = setTimeout(() => {
      endSession(sessionId);
      cleanupTimers.delete(sessionId);
      console.log(`[session] Auto-ended ${sessionId} (all disconnected for 30s)`);
    }, 30000);

    cleanupTimers.set(sessionId, timer);
  }

  // If host left, check if session should end immediately
  const session = db
    .select()
    .from(schema.watchSessions)
    .where(eq(schema.watchSessions.id, sessionId))
    .get();

  if (session && session.hostId === user.id) {
    io.to(room).emit('session:ended');
    endSession(sessionId);
    const timer = cleanupTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      cleanupTimers.delete(sessionId);
    }
  }
}

function endSession(sessionId: string): void {
  try {
    db.update(schema.watchSessions)
      .set({ status: 'ended' })
      .where(eq(schema.watchSessions.id, sessionId))
      .run();
  } catch (err: any) {
    console.error(`[session] Failed to end session ${sessionId}:`, err.message);
  }
}
