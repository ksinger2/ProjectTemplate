# Bug List — Autonomous Multi-Agent Bug Triage & Fix Orchestration

Queue bugs and issues as you find them. This command orchestrates parallel agents to triage, design, implement, review, and QA every issue — automatically looping until all bugs are resolved.

## Critical Constraint: File Lock Protocol

**NO TWO AGENTS MAY EDIT THE SAME FILE SIMULTANEOUSLY.**

Before any agent begins editing:
1. Check `tasks/file-locks.md` for currently locked files
2. If target file is locked → agent waits or picks up a different issue
3. Claim lock before editing: add file path + agent ID + timestamp
4. Release lock immediately after edit is committed
5. If an agent stalls (no update for 5+ min), lock can be broken

```markdown
<!-- tasks/file-locks.md format -->
| File Path | Agent | Claimed At | Status |
|-----------|-------|------------|--------|
| src/components/Button.tsx | frontend-engineer | 2024-01-15T10:30:00Z | editing |
```

---

## Phase 1: Bug Intake Mode

When `/bug-list` is invoked, enter intake mode:

```
🐛 Bug List Mode Active
━━━━━━━━━━━━━━━━━━━━━━
List your bugs/issues one by one. I'll queue them and dispatch agents.

Commands:
• Type bug descriptions naturally — I'll queue and categorize
• "status" — Show all bugs and their current state
• "done" — Exit intake mode and run final verification
```

### For Each Bug Received:

1. **Classify the bug type:**
   - `engineering-only`: Crashes, exceptions, build failures, code errors, type errors, null refs
   - `product-bug`: UX issues, feature gaps, flow problems, unclear behavior, edge cases
   - `design-bug`: Visual issues, spacing, colors, misalignment, accessibility, responsive

2. **Create a task** in `tasks/bug-queue.md`:
   ```markdown
   ## BUG-001: [Short title]
   - **Type**: engineering-only | product-bug | design-bug
   - **Status**: queued | in-triage | in-design | in-engineering | in-review | in-qa | resolved | blocked
   - **Priority**: P1 (critical) | P2 (high) | P3 (medium) | P4 (low)
   - **Description**: [User's original description]
   - **Files Affected**: [To be determined by agents]
   - **Assigned To**: [Agent name when picked up]
   - **Blocked By**: [BUG-XXX if dependent]
   ```

3. **Dispatch immediately** based on type (see Phase 2)

---

## Phase 2: Agent Routing by Bug Type

### Route A: Engineering-Only Bugs
**Direct to engineering — skip PM/design for pure code issues.**

```
Bug → Engineering Agent → Code Review Agent → QA Agent → Resolved
```

1. **Engineering Agent** (`frontend-engineer` or `backend-lead-engineer`):
   - Read the bug description
   - Locate affected files (max 3 file reads for diagnosis)
   - **PLAN**: Write out approach, affected files, potential side effects
   - **CRITICIZE**: Poke holes — "What could go wrong? What am I missing?"
   - **REFINE**: Iterate on the plan until confident
   - Claim file locks before implementing
   - Implement fix
   - Release file locks
   - Hand off to code review

2. **Code Review Agent** (`principal-engineer`):
   - Review the diff
   - Check: correctness, edge cases, performance, security, memory leaks
   - If issues found → send back to engineering with specific feedback
   - If approved → hand to QA

3. **QA Agent** (`qa-engineer` or `manual-qa-tester`):
   - Build the project
   - Test the specific fix
   - Test related functionality
   - If issues found → create new bug, send back to engineering queue
   - If passes → mark resolved

---

### Route B: Product/Design Bugs
**Full pipeline — PM → Design → Engineering → Review → QA**

```
Bug → PM Agent → [Project Manager + Designer in parallel] → Engineering → Review → QA → Resolved
                       ↑                                                          |
                       └──────────────────────────────────────────────────────────┘
                                        (loop if QA fails)
```

#### Step 1: Product Manager Triage
**Agent:** `principal-product-manager`

- Read the bug description
- Create VERY clear task definition:
  ```markdown
  ### PM Task Definition: BUG-XXX

  **Problem Statement**: [What is broken and why it matters]

  **Expected Behavior**: [Exactly what should happen]

  **Acceptance Criteria**:
  - [ ] Criterion 1
  - [ ] Criterion 2
  - [ ] Criterion 3

  **Edge Cases to Handle**:
  - Edge case 1
  - Edge case 2

  **Out of Scope**: [What NOT to fix in this bug]
  ```
- Hand off to Project Manager AND Designer (parallel)

#### Step 2a: Project Manager Tracking (Parallel)
**Agent:** `project-manager`

- Create detailed tracking entry in task system
- Define ALL test scenarios:
  ```markdown
  ### Test Scenarios: BUG-XXX

  **Happy Path**:
  1. Step 1 → Expected result
  2. Step 2 → Expected result

  **Error States**:
  - Input X → Should show error Y

  **Edge Cases**:
  - Empty state → Should show Z
  - Max values → Should handle gracefully

  **Regression Tests**:
  - Ensure feature A still works
  - Ensure feature B unaffected
  ```
- Monitor progress through pipeline
- Ensure exit criteria met before closing

#### Step 2b: Designer Specifications (Parallel)
**Agent:** `lead-designer`

- Create EXPLICIT design specs:
  ```markdown
  ### Design Spec: BUG-XXX

  **Component**: [Name]

  **Visual Properties**:
  - Border radius: 8px
  - Background: rgba(0, 0, 0, 0.05)
  - Shadow: 0 2px 8px rgba(0, 0, 0, 0.1)
  - Padding: 16px 24px

  **Typography**:
  - Font: Inter
  - Size: 14px / 16px / 18px
  - Weight: 400 / 500 / 600
  - Line height: 1.5
  - Color: #1A1A1A (light) / #FFFFFF (dark)

  **States**:
  - Default: [specs]
  - Hover: [specs]
  - Active/Pressed: [specs]
  - Disabled: [specs]
  - Focus: [specs]
  - Error: [specs]
  - Loading: [specs]

  **Spacing**:
  - Margin: 0 0 16px 0
  - Gap between elements: 8px

  **Animation**:
  - Transition: all 150ms ease-out

  **Responsive**:
  - Mobile: [changes]
  - Tablet: [changes]

  **Z-Index**: [if relevant]

  **Accessibility**:
  - Focus ring: 2px solid #0066FF
  - Min touch target: 44x44px
  - ARIA: [requirements]
  ```

#### Step 3: Engineering Implementation
**Agent:** `frontend-engineer` or `senior-frontend-engineer`

**MUST wait for design specs to be ready for visual changes.**

1. **Review** PM requirements + Design specs
2. **PLAN**: Write detailed approach
   - Which files to modify
   - What changes in each file
   - Dependencies and imports needed
   - Test coverage plan
3. **CRITICIZE**: Challenge the plan
   - "Is there a simpler way?"
   - "What edge cases am I missing?"
   - "Could this cause regressions?"
   - "Is this the most performant approach?"
4. **REFINE**: Iterate until high confidence
5. **Check file locks** — wait if target files are locked
6. **Claim file locks** for all files to be edited
7. **Implement** the fix
8. **Release file locks** immediately
9. Hand off to code review

#### Step 4: Code Review
**Agent:** `principal-engineer` or `frontend-lead-engineer`

- Review against:
  - PM acceptance criteria
  - Design specs
  - Code quality standards
  - Security/privacy concerns
  - Performance implications
- **If issues found**: Return to engineering with specific, actionable feedback
- **If approved**: Hand to QA

#### Step 5: QA Testing
**Agent:** `manual-qa-tester`

1. **Build** the project
2. **Test every scenario** from Project Manager's test plan
3. **Visual comparison**:
   - Use `chrome-cdp` to screenshot each state
   - Send screenshot to `lead-designer` agent for review
   - Delete screenshots after reviewed (save disk space)
4. **Interaction testing**:
   - Click, hover, long press, scroll, swipe
   - Keyboard navigation
   - Screen reader behavior (if applicable)
5. **Cross-screen testing** if relevant

**If any issues found:**
- Create new bug entry in queue
- Add to engineering's issue backlog
- Mark original bug as "in-qa-blocked"
- Engineering picks up fix, loops back through Review → QA

**If all tests pass:**
- Mark bug as `resolved`
- Notify Project Manager
- Update `tasks/bug-queue.md`

---

## Phase 3: Parallel Orchestration Rules

### Parallelization Strategy

**CAN run in parallel:**
- Multiple bugs in the same phase (if no file conflicts)
- PM triage of Bug A + Engineering implementation of Bug B
- Designer specs + Project Manager tracking (same bug)
- QA testing of Bug A + Engineering of Bug B

**CANNOT run in parallel:**
- Two agents editing the same file (HARD RULE)
- Engineering before PM/Design specs are ready (for product bugs)
- QA before engineering is complete

### Queue Management

Maintain `tasks/bug-queue.md` as single source of truth:

```markdown
# Bug Queue

## Queued (Pending Triage)
- [ ] BUG-005: Description here

## In Progress
| Bug ID | Status | Current Agent | Files Locked | Started |
|--------|--------|---------------|--------------|---------|
| BUG-001 | in-engineering | frontend-engineer | src/Button.tsx | 10:30 |
| BUG-002 | in-design | lead-designer | (none) | 10:25 |
| BUG-003 | in-qa | manual-qa-tester | (none) | 10:20 |

## Resolved
- [x] BUG-004: Fixed button alignment (resolved 10:15)

## Blocked
- [ ] BUG-006: Blocked by BUG-001 (same file)
```

---

## Phase 4: Agent Planning Protocol

**EVERY agent MUST follow this before implementing ANY fix:**

### 1. PLAN
Write out exactly what you will do:
- Files to read
- Files to modify
- Approach summary
- Expected outcome

### 2. CRITICIZE
Challenge your own plan:
- "What could go wrong?"
- "Am I missing edge cases?"
- "Is there a simpler solution?"
- "What are the performance implications?"
- "Could this break existing functionality?"

### 3. REFINE
Based on criticism, improve the plan:
- Address each concern
- Simplify if possible
- Add safeguards for identified risks

### 4. CONFIDENCE CHECK
Only proceed when you can honestly say:
- "This is the simplest solution that works"
- "I've considered the main edge cases"
- "I understand the impact on related code"
- "This is the most cost-effective approach"

If confidence is low → iterate steps 2-3 again.

---

## Status Commands

While in bug-list mode:

**"status"** — Display:
```
🐛 Bug Queue Status
━━━━━━━━━━━━━━━━━━

Queued:     3 bugs waiting
In Progress: 2 bugs being worked
Blocked:    1 bug (file conflict)
Resolved:   5 bugs fixed this session

Active Agents:
• frontend-engineer → BUG-001 (in-engineering)
• lead-designer → BUG-002 (in-design)
• manual-qa-tester → BUG-003 (in-qa)

File Locks:
• src/components/Button.tsx → frontend-engineer
```

**"done"** — Exit intake mode, wait for all agents to complete, run final verification

---

## Integration with Other Commands

- Bugs found during `/qa` → Auto-add to bug queue
- Bugs found during `/designreview` → Auto-add to bug queue
- After all bugs resolved → Consider running `/ship` to commit
- Complex bugs → May trigger `/plan` for architecture review
