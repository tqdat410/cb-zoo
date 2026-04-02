# Phase 3: Refresh docs, warnings, and rollout notes

## Context Links

- [Phase 2](./phase-02-implement-resolver-uuid-manager-migration-and-regression-tests.md)
- [Research Report](../reports/research-260402-claude-code-accountuuid-path-best-practice.md)
- [Development roadmap](../../docs/development-roadmap.md)

## Overview

- **Priority:** Medium
- **Status:** Completed
- **Effort:** 30m
- Remove stale path claims and document the new canonical-vs-fallback model.

## Key Insights

- Current docs still state `.claude/.config.json`
- Users need clear wording that `.claude.json` is current best target, but still an internal Claude Code state file
- Rollout notes should explicitly mention fallback handling and future schema-change risk

## Requirements

### Functional

- Update README safety/path notes
- Update docs that mention old path assumptions
- Record the change in changelog/roadmap

### Non-Functional

- Keep wording concise
- Avoid claiming undocumented Anthropic internals are officially stable

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `README.md` | Correct current path behavior |
| Modify | `docs/codebase-summary.md` | Reflect resolver strategy |
| Modify | `docs/project-changelog.md` | Record path-standardization change |
| Modify | `docs/development-roadmap.md` | Mark hardening/follow-up state |
| Optional modify | `docs/system-architecture.md` | If path-resolution behavior is documented there |

## Architecture

Documentation message to standardize:

- canonical runtime target: `.claude.json`
- supported override: `CLAUDE_CONFIG_DIR/.claude.json`
- fallback-only legacy/community paths: `.config.json`, `%APPDATA%\\Claude\\config.json`
- caveat: internal state file, schema may change across Claude Code releases

## Implementation Steps

1. Update user-facing docs first
2. Update internal docs and changelog
3. Ensure docs align with actual code and tests from phase 2

## Todo List

- [x] Update README path and safety notes
- [x] Update docs that still mention `.claude/.config.json`
- [x] Add changelog entry for path standardization
- [x] Update roadmap follow-up note if needed

## Success Criteria

- No stale canonical-path claim remains in docs
- Docs match resolver behavior implemented in code
- Users are warned that the target file is internal to Claude Code

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Docs overstate certainty | Misleads users | Explicitly describe `.claude.json` as current best evidence, not public stable API |
| Docs drift from implementation | Confusion | Update only after phase 2 behavior is final |

## Security Considerations

- Avoid documenting any sensitive credential payload
- Mention path only, not raw config structure beyond required field

## Next Steps

- Completed. Docs and rollout notes now reflect the implemented resolver behavior.
