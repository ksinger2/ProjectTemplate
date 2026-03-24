# Blockbuster

> **Read and follow @HardRules.md — these are non-negotiable.**

## Agent-First Orchestration

**You are an orchestrator, not a worker.** Route all substantive requests to agents.

1. **Identify request type** — match to `docs/agent-routing.md`
2. **Invoke agent(s)** — use Task tool with appropriate `subagent_type`
3. **Run in parallel** — if multiple agents listed, invoke simultaneously
4. **Summarize output** — present agent findings concisely to user

**Direct responses allowed ONLY for:**
- Greetings, acknowledgments, clarifications
- Tool use for routing (max 3 file reads, max 3 searches — see HardRules.md)
- Routing decisions

**Everything else → agents first, then summarize.**

## Project Overview
Blockbuster is a private, self-hosted Netflix-like media streaming platform. It serves movies, TV shows, music, and games from local directories to authenticated users via the web. Features include responsive Netflix-style UI, watch-together sync, emoji reactions, friend system, local recommendations, and hyper-secure content protection. No AI/LLM/cloud dependencies for core functionality.

## Tech Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript + Socket.io (port 4000)
- **Database**: SQLite (better-sqlite3) + Drizzle ORM + FTS5 for search
- **Video Player**: Plyr.io + HLS.js
- **Real-time**: Socket.io (watch-together, emoji reactions)
- **Media Processing**: ffmpeg + ffprobe (fluent-ffmpeg)
- **Auth**: JWT (httpOnly cookies) + Cloudflare Access stub
- **Deployment**: Home server / NAS, Docker Compose

## Architecture
```
Monorepo (npm workspaces)
├── frontend/          — Next.js app (port 3000)
├── backend/           — Express + Socket.io (port 4000)
├── shared/            — TypeScript types shared between packages
├── media/             — Local media files
│   ├── movies/        — Movie files + optional metadata.json
│   ├── shows/         — ShowName/Season 01/S01E01 - Title.mp4
│   ├── music/         — Music files
│   └── games/         — HTML5 games (GameName/index.html)
├── subtitles/         — title.lang.vtt / title.lang.srt
└── data/
    ├── blockbuster.db — SQLite database
    ├── avatars/       — User profile images
    └── thumbnails/    — Auto-generated poster frames
```
For detailed architecture docs, see @docs/architecture.md

## Key Conventions
- Follow existing patterns in the codebase before introducing new ones
- Check for reusable components/utilities before building new ones
- All API responses use `ApiResponse<T>` envelope from `@blockbuster/shared`
- Media files are NEVER served directly — always through signed URLs
- Genres and keywords stored as JSON arrays in SQLite text columns
- Use Drizzle ORM for all database queries (no raw SQL except FTS5)
- Frontend uses TanStack Query for server state, Zustand for client state
- All components follow the design system in @docs/design-system.md

## How to Run
```bash
npm install          # Install all workspace dependencies
npm run dev          # Start frontend (3000) + backend (4000) concurrently
```

Backend only: `npm run dev -w backend`
Frontend only: `npm run dev -w frontend`
Database migration: `npx ts-node backend/src/db/migrate.ts`

## How to Test
```bash
npm test             # Run all tests
npm test -w backend  # Backend tests only
npm test -w frontend # Frontend tests only
```

## How to Deploy
See @docs/deployment.md — Docker Compose for home server / NAS deployment.

## Session Protocol
1. Read `NextSteps.md` before starting work — it has the latest context
2. Read `Features.md` for current feature status
3. Update `NextSteps.md` when ending a session — capture what you did, what's broken, and what's next
4. Update `Features.md` when features are started, completed, or planned
5. Use `/reinit` to re-initialize project context at the start of each session
6. Use `/plan` to create structured implementation plans before building
7. Use `/review` before committing to catch issues early
8. Use `/ship` for the full build+test+verify+commit workflow

## Quality & Testing Commands
- `/runqa` — Internal QA audit using agents — no external tools needed
- `/qa` — Comprehensive QA with automated + manual testing
- `/fix` — Team-based QA and fix workflow
- `/designreview` — Designer + QA review all screens, then engineering fixes issues
- `/visual-loop` — Real-time visual iteration: screenshot → design review → PM review → engineering fix → loop until polished
- `/codeclean` — All engineering agents review and clean up the entire codebase
- `/security` — Full security audit (OWASP top 10, auth, injection, data exposure)
- `/privacy` — Privacy and data protection compliance audit (GDPR, CCPA)

## Operations Commands
- `/deploy` — Production deployment with pre-flight checks and monitoring
- `/costoptimization` — Audit agent usage, context waste, and code for cost savings
- `/oncall` — Start autonomous production monitoring with self-healing
- `/distribute` — Full release workflow: version, build, publish, deploy, announce
- `/rollback` — Explicit versioned rollback with optional migration revert
- `/deps` — Dependency audit and upgrade workflow
- `/env` — Environment variable validation and sync across environments
- `/instrument` — Add structured logging, tracing, and metrics to endpoints
- `/changelog` — Generate changelog from conventional commits
- `/autobuild` — Autonomous build loop: plan → build → test → loop until done or checkpoint

## Database & Data Commands
- `/migrate` — Database migration management: create, run, validate, rollback
- `/new-model <name>` — Scaffold a data model with ORM, migration, seed data, and types

## Testing & Debugging Commands
- `/debug` — Structured debugging workflow: isolate, diagnose, fix, verify
- `/load-test` — Performance and load testing with latency metrics
- `/snapshot` — Visual regression testing: capture and diff UI screenshots

## Scaffolding Commands
- `/new-component <name>` — Scaffold a UI component with styles, tests, and exports
- `/new-page <name>` — Scaffold a page/route with loading and error states
- `/new-endpoint <description>` — Scaffold an API endpoint with validation and tests

## Available Agents
This project includes a full product development team in `.claude/agents/`:
- **principal-product-manager** — Product strategy, requirements, competitive analysis
- **principal-engineer** — Architecture decisions, technical standards, cross-team alignment
- **project-manager** — Task tracking, coordination, exit criteria enforcement
- **lead-designer** — Design system, component specs, accessibility, visual QA
- **frontend-lead-engineer** — Frontend architecture, code reviews, component library
- **frontend-engineer** — UI implementation, design system adherence, state handling
- **senior-frontend-engineer** — End-to-end feature building, AI integration
- **backend-lead-engineer** — API design, database, security, infrastructure
- **qa-engineer** — Automated testing, test infrastructure, coverage
- **manual-qa-tester** — Manual testing, interaction testing, visual auditing
- **data-scientist** — Analytics tracking, event taxonomy, measurement plans
- **security-reviewer** — Security auditing, OWASP top 10, auth flaws, data exposure
- **on-call-engineer** — Autonomous production monitoring, incident diagnosis, self-healing
- **release-engineer** — Release management, versioning, changelog, package publishing
- **database-engineer** — Schema design, migrations, query optimization, indexing
- **technical-writer** — Documentation ownership: API docs, architecture docs, runbooks
- **devops-engineer** — Infrastructure-as-code, CI/CD, containers, environment provisioning

## Key Documentation
| Doc | Purpose |
|-----|---------|
| @docs/prd.md | Product requirements document |
| @docs/design-system.md | Visual design language and component specs |
| @docs/screen-specs.md | Screen wireframes and interaction specs |
| @docs/frontend-architecture.md | Frontend directory structure, components, hooks |
| @docs/security.md | Threat model, content protection, auth spec |
| @docs/architecture.md | System architecture |
| @docs/data-model.md | Database schema |
| @docs/api.md | API endpoint documentation |

## Browser Automation (Chrome CDP)

**Setup:**
1. Enable remote debugging: `chrome://inspect/#remote-debugging` → toggle switch
2. Requires Node.js 22+

**Quick Commands:**
```bash
.claude/skills/chrome-cdp/scripts/cdp.mjs list
.claude/skills/chrome-cdp/scripts/cdp.mjs shot <target> /tmp/screenshot.png
.claude/skills/chrome-cdp/scripts/cdp.mjs nav <target> http://localhost:3000
```
