# {{PROJECT_NAME}}

> **Read and follow @HardRules.md — these are non-negotiable.**

## Project Overview
[Describe what this project does, who it's for, and the core problem it solves]

## Tech Stack
[List frameworks, languages, key dependencies — e.g. "React + TypeScript frontend, FastAPI backend, PostgreSQL"]

## Architecture
[High-level architecture description — how components connect, data flow, key services]
For detailed architecture docs, see @docs/architecture.md

## Key Conventions
[Project-specific patterns, naming conventions, file organization rules]
- Follow existing patterns in the codebase before introducing new ones
- Check for reusable components/utilities before building new ones

## How to Run
[Build and run commands — e.g. `npm install && npm run dev`, `docker compose up`]

## How to Test
[Test commands — e.g. `npm test`, `pytest`, `flutter test`]

## How to Deploy
[Deploy commands — see @docs/deployment.md for full deployment guide]

## Session Protocol
1. Read `NextSteps.md` before starting work — it has the latest context
2. Read `Features.md` for current feature status
3. Update `NextSteps.md` when ending a session — capture what you did, what's broken, and what's next
4. Update `Features.md` when features are started, completed, or planned
5. Use `/reinit` to re-initialize project context at the start of each session
6. Use `/plan` to create structured implementation plans before building
7. Use `/review` before committing to catch issues early
8. Use `/ship` for the full build+test+verify+commit workflow
9. Use `/setup` to initialize a new project from this template
10. Use `/onboard` for comprehensive project onboarding

## Quality & Testing Commands
- `/runqa` — Internal QA audit using agents — no external tools needed
- `/qa` — Comprehensive QA with automated + manual testing
- `/fix` — Team-based QA and fix workflow
- `/designreview` — Designer + QA review all screens, then engineering fixes issues
- `/codeclean` — All engineering agents review and clean up the entire codebase
- `/security` — Full security audit (OWASP top 10, auth, injection, data exposure)
- `/privacy` — Privacy and data protection compliance audit (GDPR, CCPA)

## Operations Commands
- `/deploy` — Production deployment with pre-flight checks and monitoring
- `/costoptimization` — Audit agent usage, context waste, and code for cost savings

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
- **ai-engineer** — AI/ML integration, prompt engineering, RAG, agent frameworks
- **qa-engineer** — Automated testing, test infrastructure, coverage
- **manual-qa-tester** — Manual testing, interaction testing, visual auditing
- **data-scientist** — Analytics tracking, event taxonomy, measurement plans
- **security-reviewer** — Security auditing, OWASP top 10, auth flaws, data exposure
- **gtm-strategist** — Go-to-market strategy, positioning, launch planning, growth experiments, content/social strategy
- **social-strategist** — Autonomous social media management, content generation, Playwright automation, platform optimization

## API Documentation
See @docs/api.md for endpoint documentation and response formats.
