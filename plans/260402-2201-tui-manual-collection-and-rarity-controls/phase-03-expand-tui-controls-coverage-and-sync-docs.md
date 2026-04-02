# Phase 3: Expand TUI controls coverage and sync docs

## Context Links

- [Plan overview](./plan.md)
- [TUI controller tests](../../test/tui-controller.test.js)
- [TUI renderer tests](../../test/tui-renderers.test.js)
- [README](../../README.md)
- [Development roadmap](../../docs/development-roadmap.md)
- [Project changelog](../../docs/project-changelog.md)

## Overview

- **Priority:** Medium
- **Status:** Completed
- **Effort:** 1h
- Lock the new roll UX with focused tests and update docs so the TUI behavior is no longer documented incorrectly.

## Key Insights

- Existing tests had to move off the old auto-save and 3-button action row
- README and project docs needed to stop describing reveal-time collection saves
- This change was UX-visible, so roadmap/changelog needed to mention it in the same delivery window

## Requirements

### Functional

- Update tests for the new action row and manual save timing
- Cover `Equip` save+apply and `Add` save-once behavior
- Update user-facing docs to describe the new roll semantics

### Non-Functional

- Keep tests focused on state transitions and rendered strings instead of brittle full-screen snapshots
- Ensure docs match actual behavior exactly

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `test/tui-controller.test.js` | Cover roll action handling and state transitions |
| Modify | `test/tui-renderers.test.js` | Assert new button labels and renderer copy |
| Modify | `test/integration-flows.test.js` | Only if TUI/manual-save semantics surface here |
| Modify | `README.md` | Update roll-flow description |
| Modify | `docs/development-roadmap.md` | Note new TUI refinement when done |
| Modify | `docs/project-changelog.md` | Record behavior change after implementation |

## Architecture

```text
implementation
  -> focused tests prove action semantics
  -> README/docs describe manual add/equip behavior
```

## Implementation Steps

1. Replace outdated TUI tests that expect auto-save or `Apply/Reroll/Back`
2. Add targeted assertions for manual save timing and expanded roll controls
3. Update README and docs to describe `Add` and `Equip`
4. Run `npm test` and fix any regressions before closing the plan

## Todo List

- [x] Update controller tests for add/equip/reroll/back
- [x] Update renderer tests for new roll buttons and copy
- [x] Update README roll-flow text
- [x] Update roadmap and changelog after implementation

## Success Criteria

- Test suite captures the new manual collection semantics
- Docs no longer claim roll reveal auto-saves to collection
- Implementation can be reviewed without ambiguity about intended UX

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tests remain aligned to old semantics | False confidence | Rewrite assertions around explicit add/equip flows |
| Docs drift from code | User confusion | Update README and changelog in the same pass as tests |

## Security Considerations

- Documentation must not suggest behavior the code does not implement

## Validation Summary

- `test/tui-controller.test.js` and `test/tui-renderers.test.js` assert the new action row and manual-save behavior
- `README.md`, `docs/development-roadmap.md`, and `docs/project-changelog.md` now describe explicit `Add`/`Equip` flow instead of reveal-time auto-save
- `npm test` passed on 2026-04-02 with 68/68 tests passing

## Next Steps

Completed. Focused TUI coverage and user-facing docs are aligned with the shipped manual collection flow.
