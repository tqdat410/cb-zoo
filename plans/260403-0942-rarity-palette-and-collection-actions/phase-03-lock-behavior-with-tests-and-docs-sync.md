# Phase 3: Lock behavior with tests and docs sync

## Context Links

- [Plan overview](./plan.md)
- [TUI controller tests](../../test/tui-controller.test.js)
- [TUI renderer tests](../../test/tui-renderers.test.js)
- [TUI layout tests](../../test/tui-layout.test.js)
- [README](../../README.md)
- [Project overview PDR](../../docs/project-overview-pdr.md)
- [System architecture](../../docs/system-architecture.md)
- [Development roadmap](../../docs/development-roadmap.md)
- [Project changelog](../../docs/project-changelog.md)

## Overview

- **Priority:** Medium
- **Status:** Completed
- **Effort:** 90m
- Freeze the palette and collection interaction changes behind regression coverage, then sync the user-facing docs so the product vocabulary and behavior stay accurate.

## Key Insights

- Existing tests assert archive wording and old renderer text, so they will fail or go stale once collection copy changes
- Collection interaction coverage stops at open/navigate; it does not yet cover apply-from-collection or delete-confirm flows
- Layout coverage already protects narrow terminals, so new footer and confirm copy should extend that protection instead of bypassing it

## Requirements

### Functional

- Update renderer assertions for `Collection` wording and new action hints
- Add controller tests for collection apply, delete confirm, delete cancel, and last-entry removal
- Add or update layout tests if footer/confirm copy risks overflow in narrow terminals
- Sync README and core docs to describe collection wording and collection actions accurately

### Non-Functional

- Keep test fixtures minimal and deterministic
- Do not claim CLI flags or storage paths changed if the change is user-facing copy only
- Ensure docs distinguish internal `collection.json` storage from the old `Archive` label rename

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `test/tui-controller.test.js` | Cover collection apply/delete confirmation flows |
| Modify | `test/tui-renderers.test.js` | Update wording and visible color/render expectations |
| Modify | `test/tui-layout.test.js` | Guard narrow-width footers and prompts if needed |
| Modify | `README.md` | Update feature/copy description for collection actions |
| Modify | `docs/project-overview-pdr.md` | Reflect renamed collection surface and action semantics |
| Modify | `docs/system-architecture.md` | Document collection apply/delete interaction path |
| Modify | `docs/development-roadmap.md` | Record the TUI collection upgrade |
| Modify | `docs/project-changelog.md` | Add change log entry for palette and collection flow refresh |

## Architecture

```text
source changes
  -> renderer tests
  -> controller interaction tests
  -> layout width tests
  -> README + docs sync
```

## Implementation Steps

1. Update failing render/layout assertions to the new copy and accent expectations
2. Add collection interaction tests that exercise apply, delete cancel, delete confirm, and empty-after-delete
3. Run `npm test` and `npm run test:coverage`
4. Sync evergreen docs so they match the final UI wording and behavior

## Todo List

- [x] Update render and layout expectations
- [x] Add collection interaction regression coverage
- [x] Run full tests and coverage
- [x] Sync README and product docs

## Success Criteria

- Test suite covers the new collection workflow and passes cleanly
- Docs use `Collection` where the product UI does, without misrepresenting file paths or flags
- Narrow-terminal rendering stays intact after action footer and confirm prompt updates

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tests only cover happy path delete | Regression risk | Add cancel and empty-state cases |
| Docs overstate rename scope | Confusing internals | Keep `collection.json` and `--collection` naming explicit |
| Color assertions become brittle | Noisy failures | Assert strategic ANSI markers and behavior, not whole-screen snapshots |

## Security Considerations

- Tests must preserve the current temp-dir isolation and never touch real Claude state
- Docs must not encourage bypassing backup, validation, or confirm safeguards

## Next Steps

Completed. `npm test` and `npm run test:coverage` passed on 2026-04-03 with 80/80 tests green and 86.93% line coverage, and the planned README/docs sync landed.
