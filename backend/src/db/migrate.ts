import Database from 'better-sqlite3';
import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../../.env') });

const DATA_PATH = process.env.DATA_PATH || '../data';
const dbPath = path.resolve(__dirname, '../../', DATA_PATH, 'blockbuster.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const migrations = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('movie', 'show', 'music', 'game')),
  poster_url TEXT,
  description TEXT,
  year INTEGER,
  genres TEXT NOT NULL DEFAULT '[]',
  keywords TEXT NOT NULL DEFAULT '[]',
  duration_seconds INTEGER,
  file_path TEXT NOT NULL,
  codec TEXT,
  resolution TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  show_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  episode INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  duration_seconds INTEGER
);

CREATE TABLE IF NOT EXISTS subtitles (
  id TEXT PRIMARY KEY,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  episode_id TEXT REFERENCES episodes(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  label TEXT NOT NULL,
  file_path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS watch_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  episode_id TEXT REFERENCES episodes(id) ON DELETE CASCADE,
  position_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  percentage_watched REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'finished')),
  last_watched_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_ratings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating IN (-1, 0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, media_id)
);

CREATE TABLE IF NOT EXISTS friends (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'blocked')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  message TEXT,
  seen INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS watch_sessions (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  episode_id TEXT REFERENCES episodes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'ended')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS watch_session_participants (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES watch_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  episode_id TEXT REFERENCES episodes(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Full-text search index
CREATE VIRTUAL TABLE IF NOT EXISTS media_fts USING fts5(
  title,
  description,
  genres,
  keywords,
  content=media,
  content_rowid=rowid
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_episodes_show ON episodes(show_id, season, episode);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id, last_watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_history_status ON watch_history(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_ratings_user ON user_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends(friend_id, status);
CREATE INDEX IF NOT EXISTS idx_recommendations_to ON recommendations(to_user_id, seen);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_host ON watch_sessions(host_id, status);
CREATE INDEX IF NOT EXISTS idx_comments_media ON comments(media_id, timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id)
`;

// Execute each statement separately
const statements = migrations.split(';').filter(s => s.trim().length > 0);
for (const stmt of statements) {
  db.exec(stmt + ';');
}

// Add intro skip columns to episodes (idempotent)
try { db.exec('ALTER TABLE episodes ADD COLUMN intro_start INTEGER'); } catch {}
try { db.exec('ALTER TABLE episodes ADD COLUMN intro_end INTEGER'); } catch {}

// Add game_type column to media (idempotent)
try { db.exec('ALTER TABLE media ADD COLUMN game_type TEXT'); } catch {}

console.log('Database migrated successfully');
console.log(`Database path: ${dbPath}`);

db.close();
