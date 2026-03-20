---
description: Create a structured implementation plan before building
---

# Plan — Structured Implementation Planning

## Agent Delegation (MANDATORY)

This command routes to agents. Main instance does NOT plan directly.

1. Route to `Plan` (built-in agent)
2. Parallel: `principal-engineer` for technical feasibility
3. Agent(s) execute the workflow below
4. Main instance summarizes output (max 4 sentences)

---

Create a detailed implementation plan before building.

## Step 1: Gather Context

Read these files for current project state:
- `CLAUDE.md` — tech stack, conventions, architecture
- `HardRules.md` — constraints to follow
- `NextSteps.md` — what was done last, what's pending
- `Features.md` — current feature status

## Step 2: Understand the Request

Ask the user to describe what they want built, if not already clear.
Clarify scope, constraints, and expected behavior before planning.

## Step 3: Break Down the Work

For each step of the implementation:
1. **What** — describe the change
2. **Where** — which files to create or modify
3. **Agent** — which agent(s) from `.claude/agents/` should own this step
4. **Dependencies** — what must be done before this step

Identify which steps can run in parallel.

## Step 4: Risk Assessment

- What could break? What existing functionality is at risk?
- Are there edge cases to handle?
- Are there external dependencies or blockers?

## Step 5: Present the Plan

Format as:

```
## Plan: [Feature Name]

### Steps
| # | Task | Files | Agent | Depends On |
|---|------|-------|-------|------------|

### Parallel Groups
- Group 1 (can run together): Steps X, Y
- Group 2 (after Group 1): Steps Z

### Risks
- [Risk and mitigation]

### Exit Criteria
- [ ] [How we know it's done]
```

## Step 6: Get Approval

Wait for user approval before implementing.
Write approved plan to `tasks/todo.md` for tracking.
