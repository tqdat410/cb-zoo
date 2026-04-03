---
title: "Breed feature for collection buddies"
description: "Add one persisted egg, parent selection, and UUID-backed hatching to the existing TUI without bloating current modules."
status: completed
priority: P2
effort: 6h
branch: main
tags: [feature, tui, breeding, collection]
blockedBy: []
blocks: []
created: 2026-04-03
---

# Breed Feature

## Overview

Add a small breeding loop to the current TUI: pick two saved buddies, create one persisted egg, hatch into a real UUID-backed buddy, then save the offspring with lineage. Keep CLI flags unchanged. Reuse current settings, collection, and render patterns. No multi-egg queue. No background worker.

## Context Links

- [README](../../README.md)
- [Brainstorm report](../reports/brainstorm-260403-1828-breed-feature.md)
- [Code standards](../../docs/code-standards.md)
- [System architecture](../../docs/system-architecture.md)
- [Settings / pending buddy plan](../260403-1811-settings-merge-capacity-pending/plan.md)

## Scope Boundaries

- In scope: TUI breed flow, one persisted egg, UUID hunt at hatch, optional `bredFrom` lineage in collection, focused test coverage.
- Out of scope: CLI breed commands, multi-egg inventory, async job system, breed-table editor, docs-only feature marketing.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Breed domain and table](./phase-01-breed-engine-and-table.md) | Complete |
| 2 | [Egg persistence and collection lineage](./phase-02-egg-persistence.md) | Complete |
| 3 | [Breed and egg TUI views](./phase-03-tui-breed-egg-views.md) | Complete |
| 4 | [TUI wiring and controller modularization](./phase-04-wire-tui-integration.md) | Complete |
| 5 | [Tests and verification](./phase-05-tests.md) | Complete |

## Exact File Plan

### Modify

- `src/config.js`
- `src/settings-manager.js`
- `src/collection.js`
- `src/tui/views/home-view.js`
- `src/tui/state.js`
- `src/tui/controller.js`
- `test/settings-manager.test.js`
- `test/tui-controller.test.js`

### Create

- `src/breed-table.js`
- `src/breed-engine.js`
- `src/tui/views/breed-view.js`
- `src/tui/views/egg-view.js`
- `src/tui/breed-flow.js`
- `test/breed-engine.test.js`
- `test/tui-breed-flow.test.js`

### Delete

- None.

## File-Size Watchlist

- `src/tui/controller.js` is already `203` LOC. Breed flow must live in `src/tui/breed-flow.js`, with the controller reduced to dispatch.
- `src/settings-manager.js` is `154` LOC and `src/collection.js` is `170` LOC. Keep schema changes narrow. If either crosses roughly `190` LOC during implementation, extract validators/helpers instead of stuffing more logic in.
- `test/tui-controller.test.js` is `399` LOC. Keep only routing smoke coverage there; move breed-heavy cases into `test/tui-breed-flow.test.js`.

## Validation

- `npm test`
- `npm run test:coverage`
- Optional pre-merge gate: `npm run release:verify`
