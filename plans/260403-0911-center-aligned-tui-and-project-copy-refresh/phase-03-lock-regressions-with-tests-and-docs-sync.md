# Phase 3: Lock regressions with tests and docs sync

## Context Links

- [Plan overview](./plan.md)
- [Layout tests](../../test/tui-layout.test.js)
- [Renderer tests](../../test/tui-renderers.test.js)
- [README](../../README.md)
- [Development roadmap](../../docs/development-roadmap.md)
- [Project changelog](../../docs/project-changelog.md)

## Overview

- **Priority:** Medium
- **Status:** Completed
- **Effort:** 1.5h
- Capture the centered-shell and copy-cleanup behavior in tests, then sync core docs so the repo description matches the product language.

## Key Insights

- Current tests already assert old copy like `Pokemon-style capsule buddy machine`, so implementation will fail noisily unless tests are updated with intent
- Docs still describe the app as a Pokemon handheld-style TUI, which will become false as soon as the new copy lands
- This scope is ideal for focused render/layout assertions, not fragile snapshot sprawl

## Requirements

### Functional

- Update render/layout tests for centered-shell behavior and revised text
- Run the relevant test suite and keep failures actionable
- Update README and core docs that currently mention Pokemon-style framing

### Non-Functional

- Keep doc changes factual and limited to the product-language shift
- Avoid overpromising features not implemented yet
- Keep tests focused on behavior, not exact full-screen render dumps

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `test/tui-layout.test.js` | Assert left padding / centered-shell behavior |
| Modify | `test/tui-renderers.test.js` | Assert updated copy and normalized view content |
| Modify | `test/tui-controller.test.js` | Lock archive status wording and selective-save status copy |
| Modify | `README.md` | Remove Pokemon-style product description |
| Modify | `docs/development-roadmap.md` | Sync roadmap wording with the refined TUI |
| Modify | `docs/project-changelog.md` | Record the TUI alignment and copy cleanup |
| Modify | `docs/project-overview-pdr.md` | Remove stale Pokemon-style framing |
| Modify | `docs/system-architecture.md` | Describe the TUI without borrowed branding |

## Architecture

```text
implementation change
  -> focused renderer/layout tests
  -> README + docs sync
  -> stable product vocabulary across repo
```

## Implementation Steps

1. Update test expectations for new copy and centered layout
2. Run `npm test` and fix any renderer/layout regressions
3. Sync README and evergreen docs with the new product language
4. Record the follow-up in changelog/roadmap files

## Todo List

- [x] Update TUI tests for centered layout, revised copy, and narrow-terminal bounds
- [x] Run the relevant test suite and capture pass/fail status
- [x] Sync README and core docs with the new language
- [x] Record roadmap/changelog impact

## Success Criteria

- Tests cover the new layout contract and product wording
- README and docs no longer describe the TUI as Pokemon-themed
- The repo has one consistent vocabulary for the shell and collection UI

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Docs lag behind code | Confusing repo story | Sync docs in same implementation pass |
| Tests overfit spacing | Brittle failures | Assert meaningful markers, not whole-screen snapshots |
| Search misses older docs | Inconsistent wording | Re-run repo-wide search before closing work |

## Security Considerations

- Test and docs work must not weaken the existing safety notes around Claude state mutation
- Documentation updates must stay aligned with actual runtime behavior

## Next Steps

Completed. Tests and docs now reflect the centered shell, archive wording, and selective save flow.
