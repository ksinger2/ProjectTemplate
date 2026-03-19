# Agent Routing Table

The main Claude instance is an **orchestrator only**. All substantive work routes to agents.

## Quick Reference

| Request Type | Primary Agent | Parallel Agents |
|--------------|---------------|-----------------|
| Feature request | `principal-product-manager` | `principal-engineer` |
| Bug report | `principal-engineer` | `qa-engineer` |
| Code question | `Explore` (built-in) | — |
| Planning | `Plan` (built-in) | `principal-engineer` |
| Code review | `frontend-lead-engineer` or `backend-lead-engineer` | `security-reviewer` |
| Design question | `lead-designer` | — |
| Testing | `qa-engineer` | `manual-qa-tester` |
| Security concern | `security-reviewer` | — |
| Analytics/metrics | `data-scientist` | — |
| Documentation | `technical-writer` | — |
| Deployment | `release-engineer` | `devops-engineer` |
| Infrastructure | `devops-engineer` | — |
| Database | `database-engineer` | — |
| Performance | `backend-lead-engineer` | — |
| Growth/conversion | `growth-engineer` | `gtm-strategist` |
| Social/marketing | `social-strategist` | `gtm-strategist` |
| Incident/outage | `on-call-engineer` | — |
| General strategy | `principal-product-manager` | — |
| AI/ML integration | `ai-engineer` | — |
| UI implementation | `frontend-engineer` or `senior-frontend-engineer` | `lead-designer` |
| API design | `backend-lead-engineer` | — |
| Task coordination | `project-manager` | — |

## Routing Rules

1. **Match request to table** — find the closest request type
2. **Invoke primary agent** — always start here
3. **Invoke parallel agents** — if listed, kick them off simultaneously
4. **Summarize output** — main instance presents agent findings to user

## Examples

### "Add a dark mode toggle"
→ Route to `principal-product-manager` (feature request)
→ Parallel: `principal-engineer` for technical feasibility

### "Why is the login slow?"
→ Route to `backend-lead-engineer` (performance)

### "Review this PR"
→ Route to `frontend-lead-engineer` or `backend-lead-engineer` (based on code type)
→ Parallel: `security-reviewer`

### "How does the auth flow work?"
→ Route to `Explore` (code question)

### "Plan the payment integration"
→ Route to `Plan` (planning)
→ Parallel: `principal-engineer`

## What Main Instance Does NOT Do

- Generate code solutions
- Analyze architecture decisions
- Write tests
- Design features
- Debug issues
- Review code quality

These all route to agents. Main instance only:
- Routes requests
- Summarizes agent output
- Asks clarifying questions
- Handles greetings/acknowledgments
