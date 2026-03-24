# Blockbuster — Feature Tracking

## Phase 1: Scaffolding & Infrastructure
- [x] Monorepo setup (npm workspaces: frontend, backend, shared) (2026-03-23)
- [x] Next.js 15 frontend with Tailwind + shadcn/ui (2026-03-23)
- [x] Express + TypeScript backend with Socket.io stub (2026-03-23)
- [x] Shared TypeScript types package (2026-03-23)
- [x] SQLite + Drizzle ORM with full schema (10 tables + FTS5) (2026-03-23)
- [x] Security middleware (CSP, rate limiting, CORS, headers) (2026-03-23)
- [x] Health check endpoint (2026-03-23)
- [x] Directory structure (media, subtitles, data) (2026-03-23)
- [x] Database migration script (2026-03-23)

## Phase 2: Media Library & Scanning — Planned
- [ ] Media scanner service (ffprobe metadata extraction)
- [ ] Folder convention parsing (shows/seasons/episodes)
- [ ] Thumbnail generation (ffmpeg)
- [ ] JSON sidecar metadata support
- [ ] Subtitle file discovery
- [ ] Media API endpoints (list, detail, search, scan)
- [ ] Home page with Netflix-style category rows
- [ ] Media detail page
- [ ] Search bar with FTS5
- [ ] Admin metadata UI
- [ ] Responsive layout (mobile + desktop)

## Phase 3: Video Player & Streaming — Planned
- [ ] Signed media URLs (HMAC-SHA256)
- [ ] HTTP 206 range-request streaming
- [ ] Plyr.io + HLS.js player
- [ ] Blob URL rendering
- [ ] Subtitle loading (SRT→VTT conversion)
- [ ] Video modes (fullscreen, half-screen, PiP)
- [ ] Anti-download protections
- [ ] Music player + mini-player
- [ ] Episode navigation (season/episode select)

## Phase 4: Auth & User System — Planned
- [ ] Email-based login (JWT + Cloudflare Access stub)
- [ ] User profiles (name, avatar)
- [ ] Watch history tracking
- [ ] Continue Watching row
- [ ] Auto-resume playback
- [ ] Like/dislike ratings

## Phase 5: Recommendations — Planned
- [ ] Genre/keyword scoring algorithm
- [ ] "Recommended For You" row
- [ ] "Because You Watched X" rows
- [ ] Cold start handling

## Phase 6: Friends & Sharing — Planned
- [ ] Friend requests via email
- [ ] Accept/reject/block
- [ ] Share title recommendations
- [ ] Recommendations inbox
- [ ] "Friends Recommend" row

## Phase 7: Watch Together — Planned
- [ ] Socket.io watch sessions
- [ ] Sync playback (play/pause/seek)
- [ ] Emoji reactions (picker + burst animation)
- [ ] Session management

## Phase 8: Polish & Hardening — Planned
- [ ] HTML5 games support
- [ ] OWASP security audit
- [ ] Performance optimization
- [ ] Mobile polish + PWA
- [ ] Accessibility audit
