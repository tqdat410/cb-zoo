# Phase 1: Audit current path assumptions and target design

## Context Links

- [Research Report](../reports/research-260402-claude-code-accountuuid-path-best-practice.md)
- [Current code standards](../../docs/code-standards.md)
- [Previous Phase 2 plan](../260401-1514-cb-zoo-gacha-tool/phase-02-uuid-manager-and-config.md)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 30m
- Replace the current outdated design assumptions before touching implementation.

## Key Insights

- Current plan/docs still say `.claude/.config.json`
- Research now supports `.claude.json` as the primary account-state file
- Official Anthropic docs document `settings.json`, not a stable schema for account UUID state
- This means resolver design must prefer current evidence while still handling layout churn

## Requirements

### Functional

- Inventory every current assumption about Claude config/state paths
- Define one resolver order for all runtime reads/writes
- Define fallback behavior for legacy/community layouts

### Non-Functional

- No code edits in this phase
- Keep design minimal and centralized
- Preserve fail-closed behavior for invalid JSON or invalid UUIDs

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Review | `src/config.js` | Existing path constants and env override behavior |
| Review | `src/uuid-manager.js` | Current file read/write assumptions |
| Review | `README.md` | User-facing path claims |
| Review | `docs/codebase-summary.md` | Current summary that mentions old pathing |

## Architecture

Target resolver order:

1. `CLAUDE_CONFIG_DIR/.claude.json`
2. `~/.claude.json`
3. `CLAUDE_CONFIG_DIR/.config.json`
4. Windows-only `%APPDATA%\\Claude\\config.json`

Write target policy:

- Write only to files that contain `oauthAccount.accountUuid`
- `userID` may be used only for read-only compatibility or diagnostics

## Implementation Steps

1. List all places that currently mention `.claude/.config.json`
2. Confirm which logic should move into `src/config.js`
3. Freeze the resolver order and write-target rule
4. Define exact test matrix before phase 2 starts

## Todo List

- [x] Inventory code and docs references to old path assumptions
- [x] Freeze canonical resolver order
- [x] Freeze write-target validation rule
- [x] Define regression test matrix for fallback behavior

## Success Criteria

- One unambiguous resolver design exists
- No unresolved ambiguity around canonical vs fallback paths
- Test scope is explicit before implementation starts

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mixed old/new path claims survive | Confusing rollout | Inventory code and docs before edits |
| Resolver order too broad | Wrong file gets mutated | Prefer `.claude.json`, validate shape before write |

## Security Considerations

- Do not broaden writes beyond `oauthAccount.accountUuid`
- Avoid using undocumented fields as write targets

## Next Steps

Completed. Inputs carried into phase 2 implementation and regression coverage.
