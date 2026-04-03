---
title: "Refresh rarity colors and add collection actions"
description: "Align rarity accents with the requested palette, surface them across buddy cards, and upgrade the collection screen with apply and delete flows."
status: completed
priority: P1
effort: 4h
branch: main
tags: [tui, rarity, collection, ansi, ux]
blockedBy: []
blocks: []
created: 2026-04-03
---

# Refresh rarity colors and add collection actions

## Overview

Follow-up TUI plan focused on two visible gaps: rarity colors still do not match the requested mapping, and the `Collection` screen is still an archive browser with no direct apply/delete workflow. Scope stays inside the existing zero-dependency TUI and persistence model.

## Status Summary

- Overall status: Completed
- Phase progress: 3/3 phases complete
- Docs impact: medium
- UX impact: high
- Blocking plans: none
- Validation: `npm test` and `npm run test:coverage` passed on 2026-04-03
- Assumption: `uncommon k màu` means neutral/default shell color, while `common` becomes green

## Context Links

- [README](../../README.md)
- [Code standards](../../docs/code-standards.md)
- [System architecture](../../docs/system-architecture.md)
- [Manual collection and rarity controls plan](../260402-2201-tui-manual-collection-and-rarity-controls/plan.md)
- [Centered TUI refresh plan](../260403-0911-center-aligned-tui-and-project-copy-refresh/plan.md)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Unify rarity palette and buddy card accents](./phase-01-unify-rarity-palette-and-buddy-card-accents.md) | Completed |
| 2 | [Rename archive flows and add collection actions](./phase-02-rename-archive-flows-and-add-collection-actions.md) | Completed |
| 3 | [Lock behavior with tests and docs sync](./phase-03-lock-behavior-with-tests-and-docs-sync.md) | Completed |

## Dependencies

- Keep `collection.json` as the persisted storage file unless a later migration is explicitly requested
- Reuse existing `applyUuid()` and collection validation paths instead of inventing a new apply pipeline
- Preserve centered shell geometry and narrow-terminal behavior from the previous TUI refresh

## Success Criteria

- Requested rarity palette is applied consistently: `uncommon` neutral, `common` green, `rare` blue, `epic` magenta, `legendary` gold
- Buddy outer frames inherit rarity accents, not just inner labels, in roll, current, and collection surfaces
- User-facing TUI copy says `Collection`, not `Archive`
- Collection screen lets the user apply the selected buddy and delete the selected buddy with an explicit confirmation step
- Regression tests cover palette mapping, collection action flow, delete confirmation, and collection/current rendering

## Validation Summary

- `npm test`: passed on 2026-04-03, 80/80 tests green
- `npm run test:coverage`: passed on 2026-04-03, 80/80 tests green, 86.93% line, 78.19% branch, 88.95% function coverage
- Planned docs sync landed in `README.md`, `docs/development-roadmap.md`, `docs/project-changelog.md`, `docs/project-overview-pdr.md`, and `docs/system-architecture.md`

## Risks

- ANSI recoloring can break width math if border coloring is injected inconsistently
- Collection delete confirmation can introduce confusing key conflicts if it is treated as a separate screen instead of a focused sub-state
- Renaming `archive` too broadly can accidentally change internal persistence semantics that should stay `collection`

## Implementation Notes

- Centralize rarity palette ownership in one shared helper so `gacha-animation`, current buddy summaries, roll reveals, and collection details cannot drift
- Prefer inline confirm state inside `collection` over a new modal renderer or extra screen
- Apply from collection should mutate Claude UUID only; it must not duplicate the selected entry in `collection.json`
- Delete confirm should be destructive only after explicit accept input, then refresh list/index safely
- Delivered shared rarity accents across roll/current/collection, renamed the TUI surface to `Collection`, and added inline apply/delete collection actions with regression coverage

## Next Steps

Completed. No unfinished work found inside this plan scope. Any later UI polish or behavior expansion should go into a new follow-up plan.

## Unresolved Questions

- None.
