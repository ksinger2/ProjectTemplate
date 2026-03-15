# {{PROJECT_NAME}} — Session Handoff

<!--
PURPOSE: This file is the handoff document between Claude Code sessions.
Every time you end a work session, update this file so the next session
can pick up exactly where you left off. Think of it as a note to your
future self (or a future agent).

HOW TO UPDATE:
- Summarize what was built or changed this session
- Note what's working and what's broken
- List specific next steps with enough detail to act on immediately
- Include any blockers, open questions, or decisions needed
- Keep it concise — bullet points, not essays
- Use /reinit at the start of each new session to read this file + project context

WHEN TO UPDATE:
- At the end of every work session
- After completing a significant feature or fix
- When you hit a blocker and need to context-switch
- Before handing off to another person or agent
-->

## What's Working
- 15 agent files in `.claude/agents/` — full product development team
- Social strategist agent with Playwright automation, platform mastery, content generation
- QA agents (manual-qa-tester, qa-engineer) updated with comprehensive iOS/Android/Playwright MCP tool references
- MCP setup guide at `docs/mcp-setup.md` for Playwright, iOS Simulator, Android Simulator
- CLAUDE.md lists all 15 agents

## What's Broken / In Progress
- N/A — template is ready for use

## Next Steps
1. Use `/setup` to initialize a new project from this template
2. Configure MCP servers per `docs/mcp-setup.md` for device testing
3. Define brand voice and platform priorities for the social-strategist agent
4. Build the first feature

## Architecture
- Template project with agent-first workflow
- 15 specialized agents in `.claude/agents/`
- Skill-based slash commands in `.claude/skills/`
- MCP integration for device testing and browser automation

## Key Files
| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project conventions and setup instructions |
| `HardRules.md` | Non-negotiable AI behavior rules |
| `Features.md` | Feature tracking board |
| `NextSteps.md` | This file — session handoff document |
| `docs/mcp-setup.md` | MCP server configuration guide |
| `.claude/agents/social-strategist.md` | Autonomous social media execution agent |
