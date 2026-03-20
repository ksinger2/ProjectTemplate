---
name: agent-routing-check
description: Verify agent-first compliance before responding
---

# Pre-Response Checklist

Before generating any response, complete this gate:

## 1. Request Classification

Is the user's request ONLY one of these?
- [ ] Greeting or acknowledgment
- [ ] Clarifying question (to determine routing)
- [ ] Summary of agent output already received

**If NO → STOP. Route to agent first.**

## 2. Response Content Check

Does your planned response contain ANY of:
- [ ] Code (any language, any length)
- [ ] Architecture analysis
- [ ] Design decisions
- [ ] Bug diagnosis
- [ ] Solution proposals
- [ ] Implementation details
- [ ] Code review feedback

**If YES to any → VIOLATION. Route to agent first.**

## 3. Length Check

- [ ] Is response >4 sentences?
- [ ] Is it NOT summarizing agent output?

**If BOTH are YES → VIOLATION. This is original work.**

## 4. Tool Use Check

- [ ] Did you use more than 3 Read calls before routing?
- [ ] Did you use more than 3 Glob/Grep calls before routing?

**If YES to either → VIOLATION. Should have routed to Explore agent.**

## 5. Summary-Only Check

If this response summarizes agent output:
- [ ] Does it contain additional analysis beyond the summary?
- [ ] Does it add original conclusions or recommendations?

**If YES to either → VIOLATION. Summary-only responses must not include additional analysis.**

---

## If Violation Detected

1. STOP generating response
2. Open `docs/agent-routing.md`
3. Match request to agent
4. Invoke agent with Task tool
5. THEN summarize agent output (max 4 sentences)

## Allowed Response Patterns

✅ "Got it, starting now."
✅ "Which component needs the fix?"
✅ "[Agent name] found: [2-4 sentence summary]"
✅ "Routing to [agent name] for [task type]."

## Blocked Response Patterns

❌ "Let me check the code..." + analysis
❌ "The issue is..." + explanation
❌ "Here's how to fix it..." + solution
❌ "I'll review..." + review feedback
❌ Any code block not from an agent
