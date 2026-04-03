# Phase 04: Tests and Docs Sync

## Context Links

- [Overview Plan](./plan.md)
- [docs/project-changelog.md](../../docs/project-changelog.md)
- [docs/development-roadmap.md](../../docs/development-roadmap.md)
- [docs/system-architecture.md](../../docs/system-architecture.md)
- [docs/codebase-summary.md](../../docs/codebase-summary.md)

## Overview

- Priority: P1
- Status: Completed
- Goal: prove migration safety, slot correctness, configurable timing, and update docs to match the shipped model.

## Key Insights

- Existing coverage already exercises settings normalization, breed flow, renderers, and integration flows.
- Docs currently describe one persisted `breedEgg` and hardcoded rarity-based hatch timers; those statements will be wrong after this change.

## Requirements

- Cover settings defaults, migration, invalid config, slot overflow preservation, and per-slot hatch resume.
- Cover TUI slot picker rendering and navigation.
- Cover hatch-time config usage with non-default values.
- Update README and docs so storage format and breed behavior stay accurate.

## Related Code Files

- Modify:
  - `test/settings-manager.test.js`
  - `test/tui-breed-flow.test.js`
  - `test/tui-renderers.test.js`
  - `test/tui-layout.test.js`
  - `test/integration-flows.test.js`
  - `README.md`
  - `docs/project-changelog.md`
  - `docs/development-roadmap.md`
  - `docs/system-architecture.md`
  - `docs/codebase-summary.md`
  - `docs/project-overview-pdr.md`
- Create:
  - none
- Delete:
  - stale single-egg doc statements only via edits

## Implementation Steps

1. Add migration and settings-schema tests first.
2. Add slot-picker and per-slot resume regressions.
3. Add integration coverage proving non-default hatch timers are honored.
4. Update README and architecture docs from singleton `breedEgg` language to slot-based breeding language.
5. Run full verification gate.

## Todo List

- [x] Add settings migration tests
- [x] Add slot UI/flow tests
- [x] Add configurable hatch-time integration coverage
- [x] Update README and docs
- [x] Run `npm test`, `npm run test:coverage`, `npm run check`, `npm run smoke`

## Success Criteria

- Test suite covers both legacy migration and multi-slot steady state.
- Docs no longer claim hatch timers are hardcoded or that only one persisted egg exists.
- Full verification passes cleanly.

## Risk Assessment

- Docs drift is likely unless updated deliberately because many files mention singleton `breedEgg`.
- Integration tests may need careful fixture updates to avoid brittle assumptions about slot counts.

## Security Considerations

- Regression tests should verify corrupt slot/config state still fails closed.
- Docs must not imply unsafe manual edits or unsupported negative/zero config values.

## Next Steps

- Plan synced complete after README/docs update and verification pass.
