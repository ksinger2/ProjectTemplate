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

    const skipAuth = process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production';

    // Look up or auto-create user
    let user = db.select().from(schema.users).where(eq(schema.users.email, emailTrimmed)).get();

    if (!user && skipAuth) {
      // In dev mode with SKIP_AUTH, auto-create the user
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
      // Generic message to prevent account enumeration
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Update last active
    db.update(schema.users)
      .set({ lastActive: new Date().toISOString() })
      .where(eq(schema.users.id, user.id))
      .run();

    // Issue JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ success: false, error: 'Server configuration error' });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // Set httpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/api',
      maxAge: 3600000, // 1 hour
    });

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
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api',
  });

  res.json({ success: true, data: { message: 'Logged out' } });
});

// ---- GET /api/users/me — Get current authenticated user ----

router.get('/users/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();

    if (!user) {
      // In SKIP_AUTH mode, user may not exist in DB yet — return the dev user
      const skipAuth = process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production';
      if (skipAuth) {
        res.json({
          success: true,
          data: {
            user: {
              id: req.user!.id,
              email: req.user!.email,
              displayName: req.user!.displayName,
              avatarUrl: null,
            },
          },
        });
        return;
      }
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

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
    console.error('[users/me] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

export default router;
