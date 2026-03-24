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

## Phase 2: Media Library & Scanning — Complete
- [x] Media scanner service (ffprobe metadata extraction) (2026-03-23)
- [x] Folder convention parsing (shows/seasons/episodes) (2026-03-23)
- [x] Thumbnail generation (ffmpeg) (2026-03-23)
- [x] JSON sidecar metadata support (2026-03-23)
- [x] Subtitle file discovery (2026-03-23)
- [x] Media API endpoints (list, detail, search, scan) (2026-03-23)
- [x] Home page with Netflix-style category rows (2026-03-23)
- [x] Media detail page (2026-03-23)
- [x] Search bar with FTS5 (2026-03-24)
- [x] Admin metadata UI (2026-03-23)
- [x] Responsive layout (mobile + desktop) (2026-03-23)

## Phase 3: Video Player & Streaming — Complete
- [x] Signed media URLs (HMAC-SHA256) (2026-03-23)
- [x] HTTP 206 range-request streaming (2026-03-23)
- [x] HLS.js player with native fallback (2026-03-24)
- [x] Subtitle loading (SRT→VTT conversion) (2026-03-24)
- [x] Video modes (fullscreen, half-screen, PiP) (2026-03-24)
- [x] Anti-download protections (2026-03-23)
- [x] Music player + mini-player (2026-03-24)
- [x] Episode navigation with auto-advance (2026-03-24)
- [x] Keyboard shortcut help overlay (2026-03-24)
- [x] Stream access logging (2026-03-24)

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
