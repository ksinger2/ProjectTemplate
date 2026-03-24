import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull().default(''),
  avatarUrl: text('avatar_url'),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
  lastActive: text('last_active').notNull().default(new Date().toISOString()),
});

export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'movie' | 'show' | 'music' | 'game'
  posterUrl: text('poster_url'),
  description: text('description'),
  year: integer('year'),
  genres: text('genres').notNull().default('[]'), // JSON array
  keywords: text('keywords').notNull().default('[]'), // JSON array
  durationSeconds: integer('duration_seconds'),
  filePath: text('file_path').notNull(),
  codec: text('codec'),
  resolution: text('resolution'),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
  updatedAt: text('updated_at').notNull().default(new Date().toISOString()),
});

export const episodes = sqliteTable('episodes', {
  id: text('id').primaryKey(),
  showId: text('show_id').notNull().references(() => media.id),
  season: integer('season').notNull(),
  episode: integer('episode').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  filePath: text('file_path').notNull(),
  durationSeconds: integer('duration_seconds'),
  introStart: integer('intro_start'),
  introEnd: integer('intro_end'),
});

export const subtitles = sqliteTable('subtitles', {
  id: text('id').primaryKey(),
  mediaId: text('media_id').notNull().references(() => media.id),
  episodeId: text('episode_id').references(() => episodes.id),
  language: text('language').notNull(),
  label: text('label').notNull(),
  filePath: text('file_path').notNull(),
});

export const watchHistory = sqliteTable('watch_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  mediaId: text('media_id').notNull().references(() => media.id),
  episodeId: text('episode_id').references(() => episodes.id),
  positionSeconds: integer('position_seconds').notNull().default(0),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  percentageWatched: real('percentage_watched').notNull().default(0),
  status: text('status').notNull().default('in_progress'), // 'in_progress' | 'finished'
  lastWatchedAt: text('last_watched_at').notNull().default(new Date().toISOString()),
});

export const userRatings = sqliteTable('user_ratings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  mediaId: text('media_id').notNull().references(() => media.id),
  rating: integer('rating').notNull(), // -1, 0, 1
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

export const friends = sqliteTable('friends', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  friendId: text('friend_id').notNull().references(() => users.id),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'blocked'
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

export const recommendations = sqliteTable('recommendations', {
  id: text('id').primaryKey(),
  fromUserId: text('from_user_id').notNull().references(() => users.id),
  toUserId: text('to_user_id').notNull().references(() => users.id),
  mediaId: text('media_id').notNull().references(() => media.id),
  message: text('message'),
  seen: integer('seen', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

export const watchSessions = sqliteTable('watch_sessions', {
  id: text('id').primaryKey(),
  hostId: text('host_id').notNull().references(() => users.id),
  mediaId: text('media_id').notNull().references(() => media.id),
  episodeId: text('episode_id').references(() => episodes.id),
  status: text('status').notNull().default('active'), // 'active' | 'ended'
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

export const watchSessionParticipants = sqliteTable('watch_session_participants', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => watchSessions.id),
  userId: text('user_id').notNull().references(() => users.id),
  joinedAt: text('joined_at').notNull().default(new Date().toISOString()),
});
