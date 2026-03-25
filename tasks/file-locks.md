# File Locks

Tracks which files are currently being edited by agents to prevent merge conflicts.

**Rules:**
- Claim lock BEFORE editing
- Release lock IMMEDIATELY after commit
- Stale locks (5+ min no update) can be broken
- Check this file before claiming any lock

## Active Locks

| File Path | Agent | Claimed At | Status |
|-----------|-------|------------|--------|
| (none) | — | — | — |

## Lock History (Last 10)

| File Path | Agent | Claimed | Released | Duration |
|-----------|-------|---------|----------|----------|
| (none) | — | — | — | — |
