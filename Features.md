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

## Phase 4: Auth & User System — Complete
- [x] Email-based login with JWT access+refresh tokens (2026-03-24)
- [x] User profiles (name, avatar upload) (2026-03-24)
- [x] Watch history tracking with auto-percentage (2026-03-24)
- [x] Continue Watching row on home page (2026-03-24)
- [x] Auto-resume playback from last position (2026-03-24)
- [x] Like/dislike ratings with CRUD (2026-03-24)

## Phase 5: Recommendations — Complete
- [x] Genre/keyword scoring algorithm (3x/2x weights) (2026-03-24)
- [x] "Recommended For You" endpoint (2026-03-24)
- [x] "Because You Watched X" endpoint (2026-03-24)
- [x] Cold start handling (recent + genre diversity) (2026-03-24)

## Phase 6: Friends & Sharing — Complete
- [x] Friend requests via email (2026-03-24)
- [x] Accept/reject/block (2026-03-24)
- [x] Share title recommendations with friends (2026-03-24)
- [x] Recommendations inbox with unread badge (2026-03-24)
- [x] Share + Watch Together buttons on media detail (2026-03-24)

## Phase 7: Watch Together — Complete
- [x] Socket.io watch sessions with sync (2026-03-24)
- [x] Sync playback (play/pause/seek) with drift detection (2026-03-24)
- [x] Emoji reactions (4x5 picker + Framer Motion burst) (2026-03-24)
- [x] Session management with heartbeat (2026-03-24)

## Phase 8: Polish & Hardening — Complete
- [x] HTML5 games support (sandboxed iframe) (2026-03-24)
- [x] Security audit — 17 findings, all critical/high fixed (2026-03-24)
- [x] Performance optimization (fetchPriority, lazy loading) (2026-03-24)
- [x] PWA manifest with icons (2026-03-24)
- [x] Accessibility (skip-to-content, ARIA labels, reduced motion) (2026-03-24)
- [x] "More Like This" recommendations on detail page (2026-03-24)
- [x] Design review — 37 issues found, 16 critical/medium fixed (2026-03-24)
