# Phase 4: Tests And Docs Sync

## Context Links

- [Overview plan](./plan.md)
- [Roadmap](../../docs/development-roadmap.md)
- [System architecture](../../docs/system-architecture.md)

## Overview

- Priority: Medium
- Status: Completed
- Goal: lock refill math and roll gating with focused tests, then sync docs to the shipped single-file settings model.

## Key Insights

- The highest-risk regressions were countdown boundaries, zero-charge gating, and charge-loss rollback behavior.
- Focused unit coverage plus a few high-value integration/TUI cases was enough; no broad test rewrites were needed.
- Docs had to describe one settings file, not a split config/state model.

## Requirements

- Add focused settings-manager and roll-charge-manager tests.
- Cover CLI zero-charge blocking and rollback/refund behavior.
- Cover TUI zero-charge blocking, resume exemption, and renderer state.
- Update docs with exact schema, defaults, and user-visible behavior.
- Verify the release-oriented command set.

## Architecture

- Pure refill/countdown behavior lives in `test/roll-charge-manager.test.js`.
- Settings schema/default behavior lives in `test/settings-manager.test.js`.
- CLI side effects stay covered in `test/integration-flows.test.js`.
- TUI gating and rendering stay covered in `test/tui-controller.test.js` and `test/tui-renderers.test.js`.
- User docs and maintainer docs both now point to `~/.cb-zoo/settings.json` as the single roll-charge storage location.

## Related Code Files

- Modify:
  - `test/settings-manager.test.js`
  - `test/integration-flows.test.js`
  - `test/tui-controller.test.js`
  - `test/tui-renderers.test.js`
  - `README.md`
  - `docs/development-roadmap.md`
  - `docs/project-changelog.md`
  - `docs/system-architecture.md`
  - `docs/codebase-summary.md`
- Create:
  - `test/roll-charge-manager.test.js`
- Delete:
  - None.

## Shipped Implementation

1. Added settings-manager coverage for defaults, legacy-fill behavior, and invalid roll payload handling.
2. Added roll-charge-manager coverage for countdown formatting, lazy refill, clamping, and zero-charge failures.
3. Added CLI integration coverage for zero-charge blocking and refund semantics.
4. Added TUI controller/render coverage for blocked fresh rolls, pending-roll exemption, and reroll-empty UI.
5. Updated roadmap, changelog, architecture, summary, and README to describe the shipped behavior and settings schema.
6. Ran full validation suite.

## Todo List

- [x] Add settings roll-config tests
- [x] Add charge math tests
- [x] Add CLI integration tests
- [x] Add TUI gating/render tests
- [x] Update roadmap, changelog, architecture, summary
- [x] Run full verification commands

## Success Criteria

- Boundary behavior is locked under deterministic tests.
- Docs explain where `rollConfig` and `rollCharges` live and what the defaults are.
- Full validation suite passes without weakening existing safety checks.

## Validation Results

- `npm test` -> pass (`161/161`)
- `npm run check` -> pass
- `npm run smoke` -> pass
- `npm run test:coverage` -> pass

## Risk Assessment

- Main risk was brittle countdown rendering assertions.
- Mitigation shipped: renderer tests assert meaningful substrings and footer behavior instead of whole-screen snapshots.

## Security Considerations

- Tests verify invalid settings fail before roll side effects.
- Docs keep the roll-charge config inside cb-zoo settings, not Claude-owned files.

## Next Steps

- Plan complete. A future UX task can decide whether editing `rollConfig` needs an in-app surface or should remain manual JSON tuning.
