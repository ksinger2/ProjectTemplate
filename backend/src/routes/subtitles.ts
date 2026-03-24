import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { schema } from '../db';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ---- SRT to VTT conversion ----

function srtToVtt(srtContent: string): string {
  // Add WEBVTT header and convert comma timestamps to dot
  let vtt = 'WEBVTT\n\n';
  vtt += srtContent
    // Remove BOM if present
    .replace(/^\uFEFF/, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Convert timestamps: 00:01:23,456 --> 00:01:23.456
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

  return vtt;
}

// ---- GET /api/subtitles/:mediaId — List available subtitles for a media item ----

router.get('/subtitles/:mediaId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const mediaId = req.params.mediaId as string;

    // Verify media exists
    const mediaRow = db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();
    if (!mediaRow) {
      res.status(404).json({ success: false, error: 'Media not found' });
      return;
    }

    const subtitleRows = db
      .select()
      .from(schema.subtitles)
      .where(eq(schema.subtitles.mediaId, mediaId))
      .all();

    const subtitlesData = subtitleRows.map((sub) => ({
      id: sub.id,
      language: sub.language,
      label: sub.label,
      serveUrl: `/api/subtitles/${sub.id}/serve`,
    }));

    res.json({ success: true, data: subtitlesData });
  } catch (err: any) {
    console.error('[subtitles] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch subtitles' });
  }
});

// ---- GET /api/subtitles/:subtitleId/serve — Serve the subtitle file ----

router.get('/subtitles/:subtitleId/serve', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const subtitleId = req.params.subtitleId as string;

    const subtitleRow = db
      .select()
      .from(schema.subtitles)
      .where(eq(schema.subtitles.id, subtitleId))
      .get();

    if (!subtitleRow) {
      res.status(404).json({ success: false, error: 'Subtitle not found' });
      return;
    }

    const filePath = path.resolve(subtitleRow.filePath);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'Subtitle file not found on disk' });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf-8');

    if (ext === '.srt') {
      // Auto-convert SRT to VTT
      const vttContent = srtToVtt(content);
      res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(vttContent);
    } else {
      // Serve VTT directly
      res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(content);
    }
  } catch (err: any) {
    console.error('[subtitles/serve] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to serve subtitle' });
  }
});

export default router;
