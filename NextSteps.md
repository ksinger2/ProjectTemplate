# Blockbuster — Session Handoff

## Re-initialization Checklist
When starting a new session, read these files in order:
1. `CLAUDE.md` — Project overview, tech stack, conventions, commands
2. `HardRules.md` — Non-negotiable behavior rules
3. `Features.md` — Current feature status by phase
4. This file (`NextSteps.md`) — What was done, what's next
5. `/home/karen/.claude/plans/calm-churning-codd.md` — Full 8-phase implementation plan

### Key Design & Requirements Docs (review before building UI)
- `docs/prd.md` — Product requirements, user personas, acceptance criteria, user flows
- `docs/design-system.md` — Visual design language (Blockbuster Video blue/yellow theme), component specs
- `docs/screen-specs.md` — ASCII wireframes for all 10 screens (desktop + mobile)
- `docs/frontend-architecture.md` — Component inventory (20 components), hooks (9), state management, API client
- `docs/security.md` — Threat model, content protection spec, 50+ security test cases

### Key Code Entry Points
- `backend/src/index.ts` — Express server entry
- `backend/src/db/schema.ts` — Drizzle ORM table definitions
- `backend/src/db/migrate.ts` — Database migration (run with `npx ts-node backend/src/db/migrate.ts`)
- `backend/src/services/media-scanner.ts` — Media library scanner (if Phase 2 agent completed)
- `backend/src/routes/media.ts` — Media API endpoints (if Phase 2 agent completed)
- `frontend/src/app/layout.tsx` — Root layout
- `frontend/src/app/globals.css` — Design tokens / Tailwind theme
- `shared/src/types/` — All TypeScript type definitions

---

## What Was Done (Session 1 — 2026-03-23)

### Phase 1: Project Scaffolding (COMPLETE)
- Monorepo with npm workspaces (frontend, backend, shared)
- Next.js 15 + Tailwind + shadcn/ui (12 components) — dark theme
- Express + TypeScript + Socket.io — security middleware, rate limiting, health endpoint
- Shared TypeScript types (media, user, social, watch, API)
- SQLite + Drizzle ORM — 10 tables + FTS5 search + 9 indexes, migrated to data/blockbuster.db
- Directory structure: media/{movies,shows,music,games}, subtitles/, data/{avatars,thumbnails}

### Security Fixes (COMPLETE)
- SKIP_AUTH now blocked in production mode
- JWT_SECRET & SIGNING_SECRET replaced with strong 64-char random hex
- Startup validation blocks weak secrets in production (exits with FATAL)
- jwt.verify() pinned to HS256 (prevents `none` algorithm bypass)
- CSP expanded: connect-src, font-src, object-src, base-uri, worker-src, upgrade-insecure-requests

### Documentation (COMPLETE)
- `docs/prd.md` — Full PRD: 3 personas, 16 features, 7 user flows, launch checklist
- `docs/design-system.md` — Design system (colors, typography, 12 component specs, animations)
- `docs/screen-specs.md` — Wireframes for all 10 screens
- `docs/frontend-architecture.md` — 20 components, 9 hooks, API client, state management
- `docs/security.md` — 12 threat vectors, 50+ test cases, implementation review

### Background Agents (may have completed after session ended)
- **Backend Lead**: Building Phase 2 — media scanner service, media/admin API endpoints, FTS5 search, thumbnail generation. Check if `backend/src/services/media-scanner.ts` and `backend/src/routes/media.ts` exist.
- **Lead Designer**: Blockbuster Video rebrand — updating design system to blue (#0a1628) / yellow (#FFD100) palette inspired by the classic Blockbuster Video store. Check `docs/design-system.md` and `frontend/src/app/globals.css` for updates.

**To verify if background agents completed:**
```bash
# Check if media scanner exists (Phase 2 backend)
ls backend/src/services/media-scanner.ts 2>/dev/null && echo "Phase 2 backend: DONE" || echo "Phase 2 backend: NOT DONE"

# Check if Blockbuster rebrand was applied (look for blue/yellow colors)
grep -l "FFD100\|0a1628\|blockbuster" frontend/src/app/globals.css && echo "Rebrand: DONE" || echo "Rebrand: NOT DONE"
```

---

## What's Working
- `npm run dev` starts frontend (3000) + backend (4000)
- `curl localhost:4000/api/health` returns OK
- SQLite database at data/blockbuster.db with all tables
- All three packages compile cleanly
- Security middleware stack (CSP, rate limiting, CORS, auth)

## What's Broken / Incomplete
- Frontend has placeholder page only — no real UI screens yet
- Backend has health endpoint only (unless Phase 2 agent finished)
- No media files in library yet (directories empty — add your .mp4s to media/movies/ etc.)
- Auth is stubbed (SKIP_AUTH=true for dev)
- If designer agent finished the rebrand, the frontend engineer still needs to build the Netflix-style home page with the new Blockbuster theme

---

## Next Steps (in priority order)

### Immediate (Phase 2 completion)
1. **Verify Phase 2 agent output** — Check if media scanner + API routes were created and compile
2. **If NOT done**: Rebuild media scanner + API routes per plan
3. **If done**: Test scanner by adding sample .mp4 files and hitting `POST /api/media/scan`
4. **Verify Blockbuster rebrand** — Check if designer updated globals.css with blue/yellow theme
5. **If NOT done**: Update design tokens to Blockbuster Video palette (blue bg, yellow accents)

### Build Phase 2 Frontend
6. Build Netflix-style home page with Blockbuster Video theme (horizontal scroll rows by category)
7. Build media detail page (poster, description, genres, episodes)
8. Build search bar with FTS5 debounced search
9. Build admin metadata UI (list + edit form)
10. Build responsive layout (mobile grid + desktop scroll rows)

Use agents: `frontend-engineer` for UI, `lead-designer` for review, `senior-frontend-engineer` for complex components.

### Phase 3: Video Player & Streaming
11. Signed media URL system (HMAC-SHA256)
12. Stream endpoint with HTTP 206 range requests
13. Plyr.io + HLS.js player component with blob URLs
14. Subtitle loading (SRT→VTT auto-conversion)
15. Video modes (fullscreen, half-screen, PiP)
16. Anti-download protections
17. Music player + persistent mini-player
18. Episode navigation

### Phase 4: Auth & User System
19. Email login flow (JWT + Cloudflare Access stub)
20. User profiles (name, avatar upload)
21. Watch history tracking (position every 10s)
22. Continue Watching row
23. Like/dislike ratings

### Phase 5–8: See plan file
Full details in `/home/karen/.claude/plans/calm-churning-codd.md`

---

## Architecture Reference
```
Monorepo (npm workspaces)
├── frontend/          — Next.js 15 (port 3000) — proxies /api/* to backend
├── backend/           — Express + Socket.io (port 4000)
├── shared/            — @blockbuster/shared TypeScript types
├── media/             — Your media files go here
├── subtitles/         — .srt and .vtt files
├── data/              — SQLite DB, avatars, thumbnails
└── docs/              — PRD, design system, screen specs, security, architecture
```
