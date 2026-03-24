import { Router, Response } from 'express';
import { sqlite } from '../db';
import { AuthRequest } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ---- GET /api/stats — Playback stats dashboard ----

router.get('/stats', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // 1. Total hours watched
    const totalRow = sqlite
      .prepare('SELECT COALESCE(SUM(position_seconds), 0) AS total FROM watch_history WHERE user_id = ?')
      .get(userId) as { total: number };
    const totalHours = Math.round((totalRow.total / 3600) * 100) / 100;

    // 2. Hours watched this month
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthRow = sqlite
      .prepare(
        'SELECT COALESCE(SUM(position_seconds), 0) AS total FROM watch_history WHERE user_id = ? AND last_watched_at >= ?'
      )
      .get(userId, monthStart) as { total: number };
    const monthHours = Math.round((monthRow.total / 3600) * 100) / 100;

    // 3. Titles completed
    const completedRow = sqlite
      .prepare(
        "SELECT COUNT(DISTINCT media_id) AS count FROM watch_history WHERE user_id = ? AND status = 'finished'"
      )
      .get(userId) as { count: number };
    const titlesCompleted = completedRow.count;

    // 4. Top genres
    const genreRows = sqlite
      .prepare(
        'SELECT m.genres, wh.position_seconds FROM watch_history wh INNER JOIN media m ON wh.media_id = m.id WHERE wh.user_id = ?'
      )
      .all(userId) as Array<{ genres: string; position_seconds: number }>;

    const genreHours: Record<string, number> = {};
    let genreTotalSeconds = 0;
    for (const row of genreRows) {
      let genres: string[] = [];
      try {
        const parsed = JSON.parse(row.genres);
        if (Array.isArray(parsed)) genres = parsed;
      } catch {}
      for (const genre of genres) {
        const g = genre.trim();
        if (g) {
          genreHours[g] = (genreHours[g] || 0) + row.position_seconds;
          genreTotalSeconds += row.position_seconds;
        }
      }
    }

    const topGenres = Object.entries(genreHours)
      .map(([genre, seconds]) => ({
        genre,
        hours: Math.round((seconds / 3600) * 100) / 100,
        percentage: genreTotalSeconds > 0 ? Math.round((seconds / genreTotalSeconds) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8);

    // 5. Most watched
    const mostWatchedRow = sqlite
      .prepare(
        `SELECT m.id, m.title, m.type, m.poster_url AS posterUrl, SUM(wh.position_seconds) AS totalSeconds
         FROM watch_history wh
         INNER JOIN media m ON wh.media_id = m.id
         WHERE wh.user_id = ?
         GROUP BY wh.media_id
         ORDER BY totalSeconds DESC
         LIMIT 1`
      )
      .get(userId) as { id: string; title: string; type: string; posterUrl: string | null; totalSeconds: number } | undefined;

    const mostWatched = mostWatchedRow
      ? {
          id: mostWatchedRow.id,
          title: mostWatchedRow.title,
          type: mostWatchedRow.type,
          posterUrl: mostWatchedRow.posterUrl,
          hours: Math.round((mostWatchedRow.totalSeconds / 3600) * 100) / 100,
        }
      : null;

    // 6. Longest binge (most hours in a single day)
    const bingeRow = sqlite
      .prepare(
        `SELECT DATE(last_watched_at) AS date, SUM(position_seconds) AS totalSeconds
         FROM watch_history
         WHERE user_id = ?
         GROUP BY DATE(last_watched_at)
         ORDER BY totalSeconds DESC
         LIMIT 1`
      )
      .get(userId) as { date: string; totalSeconds: number } | undefined;

    const longestBinge = bingeRow
      ? { date: bingeRow.date, hours: Math.round((bingeRow.totalSeconds / 3600) * 100) / 100 }
      : null;

    // 7. Watch streak (longest consecutive days)
    const dateRows = sqlite
      .prepare(
        `SELECT DISTINCT DATE(last_watched_at) AS date
         FROM watch_history
         WHERE user_id = ?
         ORDER BY date ASC`
      )
      .all(userId) as Array<{ date: string }>;

    let watchStreak = 0;
    if (dateRows.length > 0) {
      let currentStreak = 1;
      let maxStreak = 1;
      for (let i = 1; i < dateRows.length; i++) {
        const prev = new Date(dateRows[i - 1].date);
        const curr = new Date(dateRows[i].date);
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (Math.round(diffDays) === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      watchStreak = maxStreak;
    }

    // 8. Time of day distribution
    const hourRows = sqlite
      .prepare(
        `SELECT CAST(strftime('%H', last_watched_at) AS INTEGER) AS hour, SUM(position_seconds) AS totalSeconds
         FROM watch_history
         WHERE user_id = ?
         GROUP BY hour`
      )
      .all(userId) as Array<{ hour: number; totalSeconds: number }>;

    const timeOfDay = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    for (const row of hourRows) {
      const hours = row.totalSeconds / 3600;
      if (row.hour >= 5 && row.hour <= 11) {
        timeOfDay.morning += hours;
      } else if (row.hour >= 12 && row.hour <= 16) {
        timeOfDay.afternoon += hours;
      } else if (row.hour >= 17 && row.hour <= 20) {
        timeOfDay.evening += hours;
      } else {
        timeOfDay.night += hours;
      }
    }
    timeOfDay.morning = Math.round(timeOfDay.morning * 100) / 100;
    timeOfDay.afternoon = Math.round(timeOfDay.afternoon * 100) / 100;
    timeOfDay.evening = Math.round(timeOfDay.evening * 100) / 100;
    timeOfDay.night = Math.round(timeOfDay.night * 100) / 100;

    // 9. Top 10 most watched
    const top10Rows = sqlite
      .prepare(
        `SELECT m.id, m.title, m.type, m.poster_url AS posterUrl, SUM(wh.position_seconds) AS totalSeconds
         FROM watch_history wh
         INNER JOIN media m ON wh.media_id = m.id
         WHERE wh.user_id = ?
         GROUP BY wh.media_id
         ORDER BY totalSeconds DESC
         LIMIT 10`
      )
      .all(userId) as Array<{ id: string; title: string; type: string; posterUrl: string | null; totalSeconds: number }>;

    const top10 = top10Rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      posterUrl: row.posterUrl,
      hours: Math.round((row.totalSeconds / 3600) * 100) / 100,
    }));

    res.json({
      success: true,
      data: {
        totalHours,
        monthHours,
        titlesCompleted,
        topGenres,
        mostWatched,
        longestBinge,
        watchStreak,
        timeOfDay,
        top10,
      },
    });
  } catch (err: any) {
    console.error('[stats] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;
