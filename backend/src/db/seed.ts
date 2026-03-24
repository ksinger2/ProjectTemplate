/**
 * Seed script for Blockbuster development data.
 * Inserts sample media records directly into the database
 * without needing ffprobe/ffmpeg.
 *
 * Run with: npx ts-node backend/src/db/seed.ts
 */

import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../../.env') });

const DATA_PATH = process.env.DATA_PATH || '../data';
const dbPath = path.resolve(__dirname, '../../', DATA_PATH, 'blockbuster.db');

console.log(`Opening database at: ${dbPath}`);
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Prepared statements
const insertMedia = db.prepare(`
  INSERT OR REPLACE INTO media (id, title, type, description, year, genres, keywords, duration_seconds, file_path, codec, resolution, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const insertEpisode = db.prepare(`
  INSERT OR REPLACE INTO episodes (id, show_id, season, episode, title, description, file_path, duration_seconds)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertFts = db.prepare(`
  INSERT INTO media_fts (rowid, title, description, genres, keywords)
  VALUES (?, ?, ?, ?, ?)
`);

// We need rowid mapping, so let's track them
interface MediaRecord {
  id: string;
  title: string;
  type: 'movie' | 'show' | 'music';
  description: string;
  year: number;
  genres: string[];
  keywords: string[];
  durationSeconds: number;
  filePath: string;
  codec: string;
  resolution: string;
}

const movies: MediaRecord[] = [
  {
    id: randomUUID(),
    title: 'The Matrix',
    type: 'movie',
    description: 'A computer programmer discovers that reality as he knows it is a simulation created by machines, and joins a rebellion to overthrow them.',
    year: 1999,
    genres: ['sci-fi', 'action', 'thriller'],
    keywords: ['simulation', 'hacker', 'chosen one', 'cyberpunk'],
    durationSeconds: 8160, // 2h 16m
    filePath: 'media/movies/The Matrix (1999)/The Matrix.mp4',
    codec: 'h264',
    resolution: '1920x1080',
  },
  {
    id: randomUUID(),
    title: 'Inception',
    type: 'movie',
    description: 'A skilled thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO.',
    year: 2010,
    genres: ['sci-fi', 'action', 'thriller'],
    keywords: ['dreams', 'heist', 'subconscious', 'reality'],
    durationSeconds: 8880, // 2h 28m
    filePath: 'media/movies/Inception (2010)/Inception.mp4',
    codec: 'h264',
    resolution: '1920x1080',
  },
  {
    id: randomUUID(),
    title: 'The Shawshank Redemption',
    type: 'movie',
    description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
    year: 1994,
    genres: ['drama'],
    keywords: ['prison', 'hope', 'friendship', 'redemption'],
    durationSeconds: 8520, // 2h 22m
    filePath: 'media/movies/The Shawshank Redemption (1994)/The Shawshank Redemption.mp4',
    codec: 'h264',
    resolution: '1920x1080',
  },
  {
    id: randomUUID(),
    title: 'Pulp Fiction',
    type: 'movie',
    description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    year: 1994,
    genres: ['crime', 'drama'],
    keywords: ['nonlinear', 'gangster', 'hitman', 'dark comedy'],
    durationSeconds: 9240, // 2h 34m
    filePath: 'media/movies/Pulp Fiction (1994)/Pulp Fiction.mp4',
    codec: 'h264',
    resolution: '1920x1080',
  },
  {
    id: randomUUID(),
    title: 'Interstellar',
    type: 'movie',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    year: 2014,
    genres: ['sci-fi', 'drama', 'adventure'],
    keywords: ['space', 'wormhole', 'time dilation', 'survival'],
    durationSeconds: 10140, // 2h 49m
    filePath: 'media/movies/Interstellar (2014)/Interstellar.mp4',
    codec: 'h264',
    resolution: '1920x1080',
  },
  {
    id: randomUUID(),
    title: 'The Dark Knight',
    type: 'movie',
    description: 'When the menace known as the Joker wreaks havoc and chaos on Gotham, Batman must accept one of the greatest psychological and physical tests.',
    year: 2008,
    genres: ['action', 'crime', 'drama'],
    keywords: ['batman', 'joker', 'gotham', 'vigilante'],
    durationSeconds: 9120, // 2h 32m
    filePath: 'media/movies/The Dark Knight (2008)/The Dark Knight.mp4',
    codec: 'h264',
    resolution: '1920x1080',
  },
];

interface ShowRecord extends MediaRecord {
  episodes: {
    season: number;
    episode: number;
    title: string;
    description: string;
    filePath: string;
    durationSeconds: number;
  }[];
}

const shows: ShowRecord[] = [
  {
    id: randomUUID(),
    title: 'Breaking Bad',
    type: 'show',
    description: 'A high school chemistry teacher turned methamphetamine manufacturer partners with a former student to secure his family\'s financial future.',
    year: 2008,
    genres: ['crime', 'drama', 'thriller'],
    keywords: ['chemistry', 'drug trade', 'transformation', 'family'],
    durationSeconds: 0, // shows don't have a single duration
    filePath: 'media/shows/Breaking Bad',
    codec: 'h264',
    resolution: '1920x1080',
    episodes: [
      {
        season: 1,
        episode: 1,
        title: 'Pilot',
        description: 'Walter White, a struggling high school chemistry teacher, is diagnosed with inoperable lung cancer. He turns to a life of crime.',
        filePath: 'media/shows/Breaking Bad/Season 01/S01E01 - Pilot.mp4',
        durationSeconds: 3480, // 58m
      },
      {
        season: 1,
        episode: 2,
        title: "Cat's in the Bag...",
        description: 'Walt and Jesse try to dispose of the two bodies in the RV, but things do not go as planned.',
        filePath: "media/shows/Breaking Bad/Season 01/S01E02 - Cat's in the Bag.mp4",
        durationSeconds: 2880, // 48m
      },
      {
        season: 1,
        episode: 3,
        title: "...And the Bag's in the River",
        description: 'Walt is faced with an impossible choice when he must deal with Krazy-8.',
        filePath: "media/shows/Breaking Bad/Season 01/S01E03 - And the Bag's in the River.mp4",
        durationSeconds: 2880, // 48m
      },
    ],
  },
  {
    id: randomUUID(),
    title: 'Stranger Things',
    type: 'show',
    description: 'When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces in order to get him back.',
    year: 2016,
    genres: ['sci-fi', 'horror', 'drama'],
    keywords: ['supernatural', '1980s', 'kids', 'upside down'],
    durationSeconds: 0,
    filePath: 'media/shows/Stranger Things',
    codec: 'h264',
    resolution: '1920x1080',
    episodes: [
      {
        season: 1,
        episode: 1,
        title: 'The Vanishing of Will Byers',
        description: 'On his way home from a friend\'s house, young Will sees something terrifying. Nearby, a sinister secret lurks in the Department of Energy.',
        filePath: 'media/shows/Stranger Things/Season 01/S01E01 - The Vanishing of Will Byers.mp4',
        durationSeconds: 2940, // 49m
      },
      {
        season: 1,
        episode: 2,
        title: 'The Weirdo on Maple Street',
        description: 'Lucas, Mike and Dustin try to talk to the girl they found in the woods. Hopper questions an anxious Joyce about an unsettling phone call.',
        filePath: 'media/shows/Stranger Things/Season 01/S01E02 - The Weirdo on Maple Street.mp4',
        durationSeconds: 3360, // 56m
      },
    ],
  },
];

const musicAlbums: MediaRecord[] = [
  {
    id: randomUUID(),
    title: 'The Dark Side of the Moon',
    type: 'music',
    description: "Pink Floyd's iconic 1973 concept album exploring themes of conflict, greed, time, and mental illness.",
    year: 1973,
    genres: ['rock', 'progressive rock'],
    keywords: ['concept album', 'classic', 'psychedelic'],
    durationSeconds: 2580, // 43m
    filePath: 'media/music/Pink Floyd/The Dark Side of the Moon',
    codec: 'mp3',
    resolution: '',
  },
];

// Run everything in a transaction
const seed = db.transaction(() => {
  // Clear existing data (in reverse dependency order)
  db.exec('DELETE FROM media_fts');
  db.exec('DELETE FROM episodes');
  db.exec('DELETE FROM subtitles');
  db.exec('DELETE FROM watch_history');
  db.exec('DELETE FROM user_ratings');
  db.exec('DELETE FROM recommendations');
  db.exec('DELETE FROM watch_session_participants');
  db.exec('DELETE FROM watch_sessions');
  db.exec('DELETE FROM media');

  console.log('Cleared existing media data.');

  // Insert movies
  for (const movie of movies) {
    insertMedia.run(
      movie.id,
      movie.title,
      movie.type,
      movie.description,
      movie.year,
      JSON.stringify(movie.genres),
      JSON.stringify(movie.keywords),
      movie.durationSeconds,
      movie.filePath,
      movie.codec,
      movie.resolution,
    );
    console.log(`  + Movie: ${movie.title} (${movie.year})`);
  }

  // Insert shows and their episodes
  for (const show of shows) {
    insertMedia.run(
      show.id,
      show.title,
      show.type,
      show.description,
      show.year,
      JSON.stringify(show.genres),
      JSON.stringify(show.keywords),
      show.durationSeconds,
      show.filePath,
      show.codec,
      show.resolution,
    );
    console.log(`  + Show: ${show.title} (${show.year})`);

    for (const ep of show.episodes) {
      const epId = randomUUID();
      insertEpisode.run(
        epId,
        show.id,
        ep.season,
        ep.episode,
        ep.title,
        ep.description,
        ep.filePath,
        ep.durationSeconds,
      );
      console.log(`    + S${String(ep.season).padStart(2, '0')}E${String(ep.episode).padStart(2, '0')}: ${ep.title}`);
    }
  }

  // Insert music
  for (const album of musicAlbums) {
    insertMedia.run(
      album.id,
      album.title,
      album.type,
      album.description,
      album.year,
      JSON.stringify(album.genres),
      JSON.stringify(album.keywords),
      album.durationSeconds,
      album.filePath,
      album.codec,
      album.resolution,
    );
    console.log(`  + Music: ${album.title} (${album.year})`);
  }

  // Populate FTS5 index
  // The FTS5 content table uses content=media, so we need to use rowid from the media table
  const allMedia = db.prepare('SELECT rowid, id, title, description, genres, keywords FROM media').all() as {
    rowid: number;
    id: string;
    title: string;
    description: string;
    genres: string;
    keywords: string;
  }[];

  for (const m of allMedia) {
    insertFts.run(m.rowid, m.title, m.description || '', m.genres, m.keywords);
  }
  console.log(`\nPopulated FTS5 index with ${allMedia.length} entries.`);
});

seed();

// Print summary
const mediaCount = db.prepare('SELECT COUNT(*) as count FROM media').get() as { count: number };
const episodeCount = db.prepare('SELECT COUNT(*) as count FROM episodes').get() as { count: number };
const ftsCount = db.prepare('SELECT COUNT(*) as count FROM media_fts').get() as { count: number };

console.log('\n--- Seed Summary ---');
console.log(`Media records:   ${mediaCount.count}`);
console.log(`Episode records: ${episodeCount.count}`);
console.log(`FTS5 entries:    ${ftsCount.count}`);

// Quick test: search for something
const searchResults = db.prepare(`
  SELECT m.title, m.type, m.year
  FROM media_fts fts
  JOIN media m ON m.rowid = fts.rowid
  WHERE media_fts MATCH ?
`).all('action') as { title: string; type: string; year: number }[];

console.log(`\nFTS5 test search for "action":`);
for (const r of searchResults) {
  console.log(`  - ${r.title} (${r.type}, ${r.year})`);
}

db.close();
console.log('\nDone.');
