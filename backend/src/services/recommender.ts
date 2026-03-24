import { db, schema } from '../db';
import { eq, and } from 'drizzle-orm';

// ---- Types ----

interface ScoredMedia {
  media: typeof schema.media.$inferSelect;
  score: number;
}

// ---- Helpers ----

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function overlapScore(a: string[], b: string[]): number {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((item) => setB.has(item.toLowerCase())).length;
}

function formatMedia(m: typeof schema.media.$inferSelect) {
  return {
    id: m.id,
    title: m.title,
    type: m.type,
    posterUrl: m.posterUrl,
    description: m.description,
    year: m.year,
    genres: parseJsonArray(m.genres),
    keywords: parseJsonArray(m.keywords),
    durationSeconds: m.durationSeconds,
    filePath: m.filePath,
    codec: m.codec,
    resolution: m.resolution,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

// ---- Weights ----

const GENRE_WEIGHT = 3;
const KEYWORD_WEIGHT = 2;
const RECENCY_DAYS = 30;
const RECENCY_BONUS = 1;
const WATCHED_PENALTY = -2;
const MAX_RESULTS = 20;

// ---- Core scoring ----

/**
 * Gather the user's preferred genres and keywords from liked + watched items.
 */
function getUserPreferences(userId: string, allMedia: (typeof schema.media.$inferSelect)[]) {
  // Liked items (rating = 1)
  const likedRatings = db
    .select()
    .from(schema.userRatings)
    .where(and(eq(schema.userRatings.userId, userId), eq(schema.userRatings.rating, 1)))
    .all();

  const likedMediaIds = new Set(likedRatings.map((r) => r.mediaId));

  // Disliked items (rating = -1) — used as negative signal
  const dislikedRatings = db
    .select()
    .from(schema.userRatings)
    .where(and(eq(schema.userRatings.userId, userId), eq(schema.userRatings.rating, -1)))
    .all();

  const dislikedMediaIds = new Set(dislikedRatings.map((r) => r.mediaId));

  // Watch history
  const watchedItems = db
    .select()
    .from(schema.watchHistory)
    .where(eq(schema.watchHistory.userId, userId))
    .all();

  const watchedMediaIds = new Set(watchedItems.map((w) => w.mediaId));

  // Build preference vectors from liked items (strong signal)
  // and watched-but-not-disliked items (weaker signal)
  const preferredGenres: string[] = [];
  const preferredKeywords: string[] = [];

  for (const m of allMedia) {
    if (likedMediaIds.has(m.id)) {
      // Liked items contribute double to preferences
      const genres = parseJsonArray(m.genres);
      const keywords = parseJsonArray(m.keywords);
      preferredGenres.push(...genres, ...genres);
      preferredKeywords.push(...keywords, ...keywords);
    } else if (watchedMediaIds.has(m.id) && !dislikedMediaIds.has(m.id)) {
      // Watched (not disliked) items contribute once
      preferredGenres.push(...parseJsonArray(m.genres));
      preferredKeywords.push(...parseJsonArray(m.keywords));
    }
  }

  return {
    preferredGenres,
    preferredKeywords,
    watchedMediaIds,
    dislikedMediaIds,
    likedMediaIds,
    hasHistory: watchedItems.length > 0 || likedRatings.length > 0,
  };
}

/**
 * Score a single media item against user preferences.
 */
function scoreMedia(
  m: typeof schema.media.$inferSelect,
  preferredGenres: string[],
  preferredKeywords: string[],
  watchedMediaIds: Set<string>,
  dislikedMediaIds: Set<string>,
): number {
  const genres = parseJsonArray(m.genres);
  const keywords = parseJsonArray(m.keywords);

  const genreScore = overlapScore(genres, preferredGenres) * GENRE_WEIGHT;
  const keywordScore = overlapScore(keywords, preferredKeywords) * KEYWORD_WEIGHT;

  // Recency bonus for items added in last 30 days
  const ageMs = Date.now() - new Date(m.createdAt).getTime();
  const recencyBonus = ageMs < RECENCY_DAYS * 24 * 60 * 60 * 1000 ? RECENCY_BONUS : 0;

  // Penalty for already-watched items
  const watchedPenalty = watchedMediaIds.has(m.id) ? WATCHED_PENALTY : 0;

  // Heavy penalty for disliked items
  const dislikedPenalty = dislikedMediaIds.has(m.id) ? -10 : 0;

  return genreScore + keywordScore + recencyBonus + watchedPenalty + dislikedPenalty;
}

// ---- Public API ----

/**
 * Get personalized recommendations for a user.
 * Cold start: returns recent additions with genre variety.
 */
export function getRecommendations(userId: string): { media: ReturnType<typeof formatMedia>; score: number }[] {
  const allMedia = db.select().from(schema.media).all();
  const prefs = getUserPreferences(userId, allMedia);

  // Cold start: no history or ratings
  if (!prefs.hasHistory) {
    return getColdStartRecommendations(allMedia);
  }

  const scored = allMedia
    .map((m) => ({
      media: m,
      score: scoreMedia(m, prefs.preferredGenres, prefs.preferredKeywords, prefs.watchedMediaIds, prefs.dislikedMediaIds),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);

  return scored.map((s) => ({
    media: formatMedia(s.media),
    score: s.score,
  }));
}

/**
 * "Because you watched X" — find similar items to a specific media.
 */
export function getBecauseYouWatched(
  userId: string,
  sourceMediaId: string,
): { media: ReturnType<typeof formatMedia>; score: number }[] | null {
  const sourceMedia = db.select().from(schema.media).where(eq(schema.media.id, sourceMediaId)).get();
  if (!sourceMedia) return null;

  const sourceGenres = parseJsonArray(sourceMedia.genres);
  const sourceKeywords = parseJsonArray(sourceMedia.keywords);

  // Get watched items to apply penalty
  const watchedItems = db
    .select()
    .from(schema.watchHistory)
    .where(eq(schema.watchHistory.userId, userId))
    .all();
  const watchedMediaIds = new Set(watchedItems.map((w) => w.mediaId));

  const allMedia = db.select().from(schema.media).all();

  const scored = allMedia
    .filter((m) => m.id !== sourceMediaId)
    .map((m) => {
      const genres = parseJsonArray(m.genres);
      const keywords = parseJsonArray(m.keywords);

      const genreScore = overlapScore(genres, sourceGenres) * GENRE_WEIGHT;
      const keywordScore = overlapScore(keywords, sourceKeywords) * KEYWORD_WEIGHT;

      // Small penalty for already-watched (still show them, just ranked lower)
      const watchedPenalty = watchedMediaIds.has(m.id) ? -1 : 0;

      return {
        media: m,
        score: genreScore + keywordScore + watchedPenalty,
      };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);

  return scored.map((s) => ({
    media: formatMedia(s.media),
    score: s.score,
  }));
}

/**
 * Cold start recommendations: recent additions with genre variety.
 */
function getColdStartRecommendations(allMedia: (typeof schema.media.$inferSelect)[]) {
  // Sort by creation date, take recent items
  const sorted = [...allMedia].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Ensure genre variety: pick from different genres
  const seenGenres = new Set<string>();
  const diverse: typeof sorted = [];
  const remaining: typeof sorted = [];

  for (const m of sorted) {
    const genres = parseJsonArray(m.genres);
    const hasNewGenre = genres.some((g) => !seenGenres.has(g.toLowerCase()));

    if (hasNewGenre) {
      diverse.push(m);
      genres.forEach((g) => seenGenres.add(g.toLowerCase()));
    } else {
      remaining.push(m);
    }

    if (diverse.length >= MAX_RESULTS) break;
  }

  // Fill remaining slots with non-diverse items
  const result = [...diverse, ...remaining].slice(0, MAX_RESULTS);

  return result.map((m) => ({
    media: formatMedia(m),
    score: 0,
  }));
}
