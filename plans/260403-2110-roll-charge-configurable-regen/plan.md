---
title: "Add configurable roll charges with regeneration"
description: "Gate new rolls behind regenerating charges and store both roll tuning and charge state safely inside settings.json."
status: completed
priority: P2
effort: 5h
branch: main
tags: [feature, roll, config, tui, cli]
blockedBy: []
blocks: []
created: 2026-04-03
---

# Roll Charges

## Overview

Shipped. New rolls and rerolls now spend 1 shared charge, charges regenerate lazily on a fixed timer, and both tuning plus mutable charge state live inside `~/.cb-zoo/settings.json`. No separate config file was added.

## Context Links

- [README](../../README.md)
- [Code standards](../../docs/code-standards.md)
- [Codebase summary](../../docs/codebase-summary.md)
- [System architecture](../../docs/system-architecture.md)
- [Breed feature plan](../260403-1901-breed-feature/plan.md)

## Progress

- Phase completion: `4/4`
- Validation passed: `npm test`, `npm run check`, `npm run smoke`, `npm run test:coverage`

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Settings schema and persisted charge state](./phase-01-config-file-and-charge-state.md) | Completed |
| 2 | [Shared roll-charge domain service](./phase-02-shared-roll-charge-domain-service.md) | Completed |
| 3 | [CLI and TUI roll gating](./phase-03-cli-and-tui-roll-gating.md) | Completed |
| 4 | [Tests and docs sync](./phase-04-tests-and-docs-sync.md) | Completed |

## Shipped File Set

### Modified

- `src/settings-manager.js`
- `src/cli.js`
- `src/tui/roll-flow.js`
- `src/tui/views/home-view.js`
- `src/tui/views/roll-view.js`
- `test/settings-manager.test.js`
- `test/integration-flows.test.js`
- `test/tui-controller.test.js`
- `test/tui-renderers.test.js`
- `README.md`
- `docs/development-roadmap.md`
- `docs/project-changelog.md`
- `docs/system-architecture.md`
- `docs/codebase-summary.md`

### Created

- `src/roll-charge-manager.js`
- `test/roll-charge-manager.test.js`

### Deleted

- None.

## Implementation Notes

- `settings-manager.js` stayed the single storage module and now owns `rollConfig` plus `rollCharges` normalization and accessors.
- `roll-charge-manager.js` centralizes refill math, charge snapshots, countdown formatting, and the CLI consume helper.
- CLI uses shared consume/refund behavior.
- TUI reuses the shared snapshot/countdown logic but persists charge spend together with `pendingBuddy` in one `saveSettings()` write so a failed pending-save cannot burn a charge.

## Validation

- `npm test` -> pass (`161/161`)
- `npm run check` -> pass
- `npm run smoke` -> pass
- `npm run test:coverage` -> pass (`89.40%` lines, `81.99%` branches, `92.51%` funcs overall)
