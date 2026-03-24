import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db';
import { schema } from '../db';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { authMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rate-limit';

const router = Router();

// Cookie options helper
function cookieOpts(maxAgeMs: number) {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    path: '/api',
    maxAge: maxAgeMs,
  };
}

function refreshCookieOpts(maxAgeMs: number) {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    path: '/api/auth/refresh',
    maxAge: maxAgeMs,
  };
}

// ---- POST /api/auth/login — Authenticate user ----

router.post('/auth/login', authLimiter, (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    // Basic email validation
    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      res.status(400).json({ success: false, error: 'Invalid email format' });
      return;
    }

    // Look up or auto-create user
    let user = db.select().from(schema.users).where(eq(schema.users.email, emailTrimmed)).get();

    if (!user) {
      // Auto-create user on first login
      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      db.insert(schema.users).values({
        id: newId,
        email: emailTrimmed,
        displayName: emailTrimmed.split('@')[0],
        createdAt: now,
        lastActive: now,
      }).run();
      user = db.select().from(schema.users).where(eq(schema.users.id, newId)).get();
    }

    if (!user) {
      res.status(500).json({ success: false, error: 'Failed to create user' });
      return;
    }

    // Update last active
    db.update(schema.users)
      .set({ lastActive: new Date().toISOString() })
      .where(eq(schema.users.id, user.id))
      .run();

    // Issue tokens
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ success: false, error: 'Server configuration error' });
      return;
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };

    // Access token: 1 hour
    const accessToken = jwt.sign(tokenPayload, secret, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });

    // Refresh token: 7 days (contains only user id)
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      secret,
      { algorithm: 'HS256', expiresIn: '7d' }
    );

    // Set httpOnly cookies
    res.cookie('token', accessToken, cookieOpts(3600000)); // 1 hour
    res.cookie('refreshToken', refreshToken, refreshCookieOpts(7 * 24 * 3600000)); // 7 days

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (err: any) {
    console.error('[auth/login] Error:', err.message);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// ---- POST /api/auth/logout — Clear auth cookies ----

router.post('/auth/logout', (req: AuthRequest, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const clearOpts = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    path: '/api',
  };

  res.clearCookie('token', clearOpts);
  res.clearCookie('refreshToken', {
    ...clearOpts,
    path: '/api/auth/refresh',
  });

  res.json({ success: true, data: { message: 'Logged out' } });
});

// ---- POST /api/auth/refresh — Issue new access token from refresh token ----

router.post('/auth/refresh', (req: AuthRequest, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token required.',
        },
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ success: false, error: 'Server configuration error' });
      return;
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, secret, { algorithms: ['HS256'] }) as {
      id: string;
      type?: string;
    };

    if (decoded.type !== 'refresh') {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token type.',
        },
      });
      return;
    }

    // Look up user
    const user = db.select().from(schema.users).where(eq(schema.users.id, decoded.id)).get();

    if (!user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found.',
        },
      });
      return;
    }

    // Issue new access token
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    res.cookie('token', accessToken, cookieOpts(3600000));

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token expired. Please log in again.',
        },
      });
      return;
    }
    console.error('[auth/refresh] Error:', err.message);
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token.',
      },
    });
  }
});

export default router;
