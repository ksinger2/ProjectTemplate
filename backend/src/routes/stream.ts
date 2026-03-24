import { Router, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { schema } from '../db';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { authMiddleware } from '../middleware/auth';
import { streamLimiter } from '../middleware/rate-limit';

const router = Router();

const SIGNING_SECRET = process.env.SIGNING_SECRET || '';
const SIGNING_TTL_MS = 60 * 60 * 1000; // 1 hour

// ---- Helper: generate HMAC-SHA256 signature ----

function generateSignature(userId: string, mediaId: string, expiresAt: number): string {
  const data = `${userId}:${mediaId}:${expiresAt}`;
  return crypto.createHmac('sha256', SIGNING_SECRET).update(data).digest('hex');
}

function verifySignature(sig: string, userId: string, mediaId: string, expiresAt: number): boolean {
  const expected = generateSignature(userId, mediaId, expiresAt);
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

// ---- Content-Type map ----

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

// ---- POST /api/media/:id/stream-url — Generate signed streaming URL ----

router.post('/media/:id/stream-url', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const mediaId = req.params.id as string;
    const userId = req.user!.id;

    // Verify media exists
    const mediaRow = db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();
    if (!mediaRow) {
      res.status(404).json({ success: false, error: 'Media not found' });
      return;
    }

    const expiresAt = Date.now() + SIGNING_TTL_MS;
    const sig = generateSignature(userId, mediaId, expiresAt);

    const url = `/api/stream/${mediaId}?sig=${sig}&exp=${expiresAt}&uid=${userId}`;

    res.json({ success: true, data: { url, expiresAt } });
  } catch (err: any) {
    console.error('[stream-url] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate stream URL' });
  }
});

// ---- Also support episode stream URLs ----

router.post('/episodes/:id/stream-url', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const episodeId = req.params.id as string;
    const userId = req.user!.id;

    const episodeRow = db.select().from(schema.episodes).where(eq(schema.episodes.id, episodeId)).get();
    if (!episodeRow) {
      res.status(404).json({ success: false, error: 'Episode not found' });
      return;
    }

    const expiresAt = Date.now() + SIGNING_TTL_MS;
    const sig = generateSignature(userId, episodeId, expiresAt);

    const url = `/api/stream/episode/${episodeId}?sig=${sig}&exp=${expiresAt}&uid=${userId}`;

    res.json({ success: true, data: { url, expiresAt } });
  } catch (err: any) {
    console.error('[episode-stream-url] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate stream URL' });
  }
});

// ---- GET /api/stream/:mediaId — Stream media file with signed URL validation ----

router.get('/stream/:mediaId', streamLimiter, authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const mediaId = req.params.mediaId as string;
    const sig = req.query.sig as string;
    const exp = req.query.exp as string;
    const uid = req.query.uid as string;

    // Validate required params
    if (!sig || !exp || !uid) {
      res.status(403).json({ success: false, error: 'Missing signature parameters' });
      return;
    }

    const expiresAt = parseInt(exp, 10);

    // Check expiry
    if (Date.now() > expiresAt) {
      res.status(403).json({ success: false, error: 'Stream URL has expired' });
      return;
    }

    // Verify user matches authenticated user
    if (uid !== req.user!.id) {
      res.status(403).json({ success: false, error: 'User mismatch' });
      return;
    }

    // Verify signature
    if (!verifySignature(sig, uid, mediaId, expiresAt)) {
      res.status(403).json({ success: false, error: 'Invalid signature' });
      return;
    }

    // Look up media file path
    const mediaRow = db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();
    if (!mediaRow) {
      res.status(404).json({ success: false, error: 'Media not found' });
      return;
    }

    const filePath = path.resolve(mediaRow.filePath);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'Media file not found on disk' });
      return;
    }

    // Access logging
    const isRangeStart = !req.headers.range || req.headers.range === 'bytes=0-';
    if (isRangeStart) {
      console.log(`[stream] userId=${uid} mediaId=${mediaId} action=start timestamp=${new Date().toISOString()}`);
    }

    res.on('finish', () => {
      if (res.statusCode === 200) {
        console.log(`[stream] userId=${uid} mediaId=${mediaId} action=complete timestamp=${new Date().toISOString()}`);
      }
    });

    serveFileWithRanges(req, res, filePath);
  } catch (err: any) {
    console.error('[stream] Error:', err.message);
    res.status(500).json({ success: false, error: 'Stream failed' });
  }
});

// ---- GET /api/stream/episode/:episodeId — Stream episode file ----

router.get('/stream/episode/:episodeId', streamLimiter, authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const episodeId = req.params.episodeId as string;
    const sig = req.query.sig as string;
    const exp = req.query.exp as string;
    const uid = req.query.uid as string;

    if (!sig || !exp || !uid) {
      res.status(403).json({ success: false, error: 'Missing signature parameters' });
      return;
    }

    const expiresAt = parseInt(exp, 10);

    if (Date.now() > expiresAt) {
      res.status(403).json({ success: false, error: 'Stream URL has expired' });
      return;
    }

    if (uid !== req.user!.id) {
      res.status(403).json({ success: false, error: 'User mismatch' });
      return;
    }

    if (!verifySignature(sig, uid, episodeId, expiresAt)) {
      res.status(403).json({ success: false, error: 'Invalid signature' });
      return;
    }

    const episodeRow = db.select().from(schema.episodes).where(eq(schema.episodes.id, episodeId)).get();
    if (!episodeRow) {
      res.status(404).json({ success: false, error: 'Episode not found' });
      return;
    }

    const filePath = path.resolve(episodeRow.filePath);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'Episode file not found on disk' });
      return;
    }

    // Access logging
    const isRangeStart = !req.headers.range || req.headers.range === 'bytes=0-';
    if (isRangeStart) {
      console.log(`[stream] userId=${uid} episodeId=${episodeId} action=start timestamp=${new Date().toISOString()}`);
    }

    res.on('finish', () => {
      if (res.statusCode === 200) {
        console.log(`[stream] userId=${uid} episodeId=${episodeId} action=complete timestamp=${new Date().toISOString()}`);
      }
    });

    serveFileWithRanges(req, res, filePath);
  } catch (err: any) {
    console.error('[stream/episode] Error:', err.message);
    res.status(500).json({ success: false, error: 'Stream failed' });
  }
});

// ---- Helper: Serve file with HTTP 206 range request support ----

function serveFileWithRanges(req: AuthRequest, res: Response, filePath: string): void {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
      res.end();
      return;
    }

    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });

    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
    });

    fs.createReadStream(filePath).pipe(res);
  }
}

export default router;
