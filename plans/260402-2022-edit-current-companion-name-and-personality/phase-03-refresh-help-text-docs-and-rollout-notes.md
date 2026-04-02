# Phase 3: Refresh help text, docs, and rollout notes

## Context Links

- [Phase 2](./phase-02-implement-companion-metadata-updates-and-regression-coverage.md)
- [README](../../README.md)
- [Development roadmap](../../docs/development-roadmap.md)
- [Project changelog](../../docs/project-changelog.md)

## Overview

- **Priority:** Medium
- **Status:** Completed
- **Effort:** 1h
- Sync the new edit flow into help text and project docs so behavior is explicit.

## Key Insights

- The README already documents that Claude stores `companion.name` and `companion.personality`
- `docs/project-overview-pdr.md` and `docs/system-architecture.md` should mention the new metadata-edit capability once implemented
- The roadmap/changelog files are already the project's lightweight release memory and should be updated after the feature lands

## Requirements

### Functional

- Document new CLI flags and usage examples
- Explain that metadata edits keep UUID-derived bones unchanged
- Explain that editing requires an existing stored companion

### Non-Functional

- Keep docs short and accurate
- Do not document behavior until it exists in code and tests

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `README.md` | Add new flags to usage and safety notes |
| Modify | `docs/code-standards.md` | Update safety rules for allowed companion metadata writes |
| Modify | `docs/project-overview-pdr.md` | Update functional requirements |
| Modify | `docs/system-architecture.md` | Reflect new mutation path in modules/data flow |
| Modify | `docs/development-roadmap.md` | Mark feature progress after implementation |
| Modify | `docs/project-changelog.md` | Record the new capability |
| Modify | `.env.example` | Keep documented environment overrides aligned with supported config resolution |

## Architecture

```text
Docs updates
  -> CLI help and README show edit examples
  -> architecture docs note companion-metadata mutation path
  -> roadmap/changelog record delivery once implemented and verified
```

## Implementation Steps

1. Update `README.md`
   - add flag list
   - add usage examples
   - add note that edits do not change UUID-derived stats/cosmetics
2. Update project docs
   - code standards safety rules
   - PDR functional requirements
   - architecture module/data-flow notes
   - roadmap and changelog entries
   - environment override example file
3. Re-run verification after doc edits if any commands or examples changed during implementation

## Todo List

- [x] Update README help/usage/safety notes
- [x] Sync docs with actual implemented behavior
- [x] Record roadmap and changelog entries after verification

## Success Criteria

- A user can discover and understand the new edit flow from repo docs alone
- Docs do not claim features or edge cases that code does not implement
- Roadmap/changelog reflect the shipped state accurately

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Docs drift from final CLI syntax | Medium | Update docs after code/tests settle |
| README overstates behavior | Medium | Limit copy to verified paths and examples |
| Roadmap misses shipped scope | Low | Update roadmap/changelog in same delivery pass |

## Security Considerations

- Keep documentation explicit that only companion metadata changes; UUID edits remain separate
- Avoid examples that imply users should hand-edit Claude state files directly

## Next Steps

Completed. README, project docs, and `.env.example` now describe the edit flow, its guardrails, and the fact that UUID-derived bones stay unchanged.
