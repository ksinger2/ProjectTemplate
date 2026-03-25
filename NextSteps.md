# Blockbuster — Session Handoff

## Re-initialization Checklist
When starting a new session, run `/reinit` or read these files in order:
1. `CLAUDE.md` — Project overview, tech stack, conventions, commands
2. `HardRules.md` — Non-negotiable behavior rules
3. `Features.md` — Current feature status by phase
4. This file (`NextSteps.md`) — What was done, what's next

### Key Code Entry Points
- `backend/src/index.ts` — Express server entry (port 4000)
- `frontend/src/app/layout.tsx` — Root layout
- `frontend/src/app/globals.css` — Blockbuster store design tokens
- `backend/src/db/schema.ts` — Drizzle ORM tables (media, episodes, subtitles, users, watchHistory, ratings, friends, comments, sessions)
- `backend/src/services/media-scanner.ts` — Media library scanner
- `backend/src/services/recommender.ts` — Recommendations engine
- `backend/src/routes/` — All API routes (media, admin, stream, auth, users, ratings, comments, upload, stats, friends, sessions, recommendations)

### Running the App
```bash
cd ~/Desktop/Blockbuster
npm run dev                    # Starts backend (4000) + frontend (3001)
curl -X POST localhost:4000/api/media/scan  # Scan media library
```
Frontend runs on **port 3001** (not 3000 — 3000 is used by another project).

---

## What Was Done (Session 2 — 2026-03-24/25)

### All 8 Core Phases — COMPLETE
- Phase 1: Monorepo scaffolding (Next.js + Express + SQLite + Drizzle)
- Phase 2: Media scanner, Netflix-style UI, FTS5 search, admin CRUD
- Phase 3: Video player (HLS.js, PiP, half-screen, subtitles, anti-download)
- Phase 4: Auth (JWT access+refresh tokens), profiles, watch history, ratings
- Phase 5: Recommendations engine (genre/keyword scoring, cold start)
- Phase 6: Friends system, share recommendations, inbox with badge
- Phase 7: Watch Together (Socket.io sync, emoji reactions with burst animation)
- Phase 8: Games (HTML5/Flash/DOS), PWA, accessibility, security hardening

### Bonus Features — COMPLETE
- **Docker + Caddy HTTPS** — Dockerfiles, docker-compose.yml, Caddyfile, .env.production
- **Skip Intro** — admin sets timestamps, player shows Skip Intro button
- **Playback Stats Dashboard** — "Your Blockbuster Wrapped" at /stats
- **Admin Upload Page** — drag-drop file upload at /admin/upload
- **Timed Comments** — pinned to timestamps, yellow dots on seek bar, toggle ON/OFF
- **Live Chat** — real-time chat panel in player via Socket.io
- **Flash Games (Ruffle)** — .swf files play via Ruffle WASM emulator
- **DOS Games (JS-DOS)** — .zip bundles play via browser DOSBox
- **Blockbuster Store Aesthetic** — carpet texture, neon strips, DVD case cards, shelf rows

### Design & Branding
- Real Blockbuster torn-ticket logo (PNG with transparent bg)
- 4-layer yellow glow effect (storefront sign look)
- Neon yellow accent strip on NavBar
- DVD case card styling with glossy overlay + shelf-pull hover
- Category shelf labels with yellow gradient underline
- Warm dark background with carpet texture overlay

### Bug Fixes Applied
- Search page reads ?type= query param correctly
- Admin page handles paginated API response
- Player controls: buffering spinner, click-to-play, fullscreen fix
- Like/dislike: correct API values (like/dislike not up/down), proper DELETE for toggle-off
- Rating response: reads ratingValue (number) not rating (string)
- Avatar upload with refreshUser() for immediate display
- MiniPlayer: close works, z-index fixed, layout padding dynamic
- Timed comments: flatten nested user object from API
- Single logo instance (no duplicates)
- Emoji burst slowed to 4s
- CommentInput repositioned above controls

### Security Audit (17 findings, all critical/high fixed)
- Auth middleware on all media + admin routes
- filePath stripped from all API responses
- Refresh token cookie path restricted
- UUID validation on file-serving paths
- HSTS header in production
- JSON body limit 100kb

### QA Results
- 12/12 API endpoint tests passing
- All 12 frontend pages return HTTP 200
- All 3 real movies stream with HTTP 206 range requests

---

## What's Working
- `npm run dev` starts frontend (3001) + backend (4000)
- 3 real movies in library: Legally Blonde (2001), Legally Blonde 2 (2003), Endless Love (2014)
- Full streaming with seek, subtitles, player controls
- Search with type filters (Movies/Shows/Music/Games)
- Admin panel with metadata editing + upload
- Recommendations, ratings, watch history
- Friends, sharing, watch together, emoji reactions
- Timed comments + live chat in player
- Stats dashboard
- Flash + DOS game support
- Blockbuster store visual theme

## What Needs Attention
- **Real media needed** — only 3 movies, no shows/music/games with real files yet
- **Offline viewing** — user wants this eventually (not started)
- **Player controls** — user reported some controls not working in browser (verified working via QA but needs manual browser testing)
- **Profile avatar** — upload endpoint works but display may need browser verification
- **Live chat backend** — Socket.io chat events (chat:join, chat:message) not yet handled server-side in socket.ts
- **Docker deployment** — files created but not tested end-to-end

## How to Add Media
```bash
# Movies
mkdir -p media/movies/"Movie Name (Year)"
# Put .mp4/.mkv file in there + optional metadata.json

# Download via torrent
aria2c --dir="media/movies/Movie Name (Year)" --seed-time=0 "magnet:?xt=..."

# Scan into library
curl -X POST localhost:4000/api/media/scan

# Or use the upload page at localhost:3001/admin/upload
```

---

## Architecture
```
Monorepo (npm workspaces)
├── frontend/          — Next.js 16 (port 3001) — Blockbuster store UI
├── backend/           — Express + Socket.io (port 4000) — API + streaming
├── shared/            — @blockbuster/shared TypeScript types
├── media/             — Your media files (movies, shows, music, games)
├── subtitles/         — .srt and .vtt files
├── data/              — SQLite DB, avatars, thumbnails
├── docs/              — PRD, design system, screen specs, security
├── Caddyfile          — HTTPS reverse proxy config
├── docker-compose.yml — Container orchestration
└── .env.production    — Production env template
```
