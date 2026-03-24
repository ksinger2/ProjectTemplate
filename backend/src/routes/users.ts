import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { db } from '../db';
import { schema } from '../db';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const DATA_PATH = path.resolve(__dirname, '../../../', process.env.DATA_PATH || '../data');
const AVATARS_PATH = path.join(DATA_PATH, 'avatars');

// Ensure avatars directory exists
if (!fs.existsSync(AVATARS_PATH)) {
  fs.mkdirSync(AVATARS_PATH, { recursive: true });
}

// ---- Multer config for avatar uploads ----

const upload = multer({
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  },
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, AVATARS_PATH);
    },
    filename: (req: any, _file, cb) => {
      const userId = req.user?.id || 'unknown';
      cb(null, `${userId}.jpg`);
    },
  }),
});

// ---- Helper: strip HTML tags ----

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

// ---- PATCH /api/users/me — Update display name ----

router.patch('/users/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { displayName } = req.body;

    if (displayName !== undefined) {
      const cleaned = stripHtml(String(displayName)).trim();

      if (cleaned.length < 1 || cleaned.length > 50) {
        res.status(400).json({ success: false, error: 'Display name must be 1-50 characters' });
        return;
      }

      // Ensure user exists (create in dev mode if needed)
      let user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
      if (!user) {
        const skipAuth = process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production';
        if (skipAuth) {
          db.insert(schema.users).values({
            id: userId,
            email: req.user!.email,
            displayName: cleaned,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
          }).run();
          user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
        }
      }

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      db.update(schema.users)
        .set({ displayName: cleaned })
        .where(eq(schema.users.id, userId))
        .run();

      const updated = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();

      res.json({
        success: true,
        data: {
          user: {
            id: updated!.id,
            email: updated!.email,
            displayName: updated!.displayName,
            avatarUrl: updated!.avatarUrl,
          },
        },
      });
    } else {
      res.status(400).json({ success: false, error: 'No fields to update' });
    }
  } catch (err: any) {
    console.error('[users/me PATCH] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// ---- POST /api/users/me/avatar — Upload avatar image ----

router.post(
  '/users/me/avatar',
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    upload.single('avatar')(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({ success: false, error: 'Avatar must be under 2MB' });
            return;
          }
        }
        res.status(400).json({ success: false, error: err.message || 'Upload failed' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      try {
        const userId = req.user!.id;
        const avatarUrl = `/api/users/${userId}/avatar`;

        // Update user record
        db.update(schema.users)
          .set({ avatarUrl })
          .where(eq(schema.users.id, userId))
          .run();

        res.json({ success: true, data: { avatarUrl } });
      } catch (innerErr: any) {
        console.error('[users/me/avatar] Error:', innerErr.message);
        res.status(500).json({ success: false, error: 'Failed to save avatar' });
      }
    });
  }
);

// ---- GET /api/users/:id/avatar — Serve avatar image ----

router.get('/users/:id/avatar', (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const avatarPath = path.join(AVATARS_PATH, `${id}.jpg`);

    if (!fs.existsSync(avatarPath)) {
      res.status(404).json({ success: false, error: 'Avatar not found' });
      return;
    }

    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Type', 'image/jpeg');
    fs.createReadStream(avatarPath).pipe(res);
  } catch (err: any) {
    console.error('[users/:id/avatar] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to serve avatar' });
  }
});

export default router;
