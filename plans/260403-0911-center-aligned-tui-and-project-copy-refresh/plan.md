---
title: "Center-align the TUI and remove generic handheld copy"
description: "Refine cb-zoo's TUI geometry, normalize internal frames, and replace Pokemon-style wording with project-specific copy."
status: completed
priority: P1
effort: 5h
branch: main
tags: [tui, layout, copy, terminal-ui]
blockedBy: []
blocks: []
created: 2026-04-03
---

# Center-align the TUI and remove generic handheld copy

## Overview

Follow-up plan to tighten the current TUI shell. Scope is narrow and visual: center the shell inside the terminal, standardize inner frame rules so bordered content does not drift or clip, and rewrite copy so the app feels like `cb-zoo`, not a Pokemon-themed placeholder.

## Status Summary

- Overall status: Completed
- Phase progress: 3/3 phases complete
- Docs impact: medium
- UX impact: high
- Blocking plans: none
- Validation: `npm test` and `npm run test:coverage` passed on 2026-04-03

## Context Links

- [README](../../README.md)
- [Code standards](../../docs/code-standards.md)
- [System architecture](../../docs/system-architecture.md)
- [Default handheld TUI plan](../260402-2053-default-pokemon-handheld-tui/plan.md)
- [TUI controls follow-up plan](../260402-2201-tui-manual-collection-and-rarity-controls/plan.md)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Define centered shell geometry and shared frame rules](./phase-01-define-centered-shell-geometry-and-shared-frame-rules.md) | Completed |
| 2 | [Normalize views and rewrite copy for cb-zoo](./phase-02-normalize-views-and-rewrite-copy-for-cb-zoo.md) | Completed |
| 3 | [Lock regressions with tests and docs sync](./phase-03-lock-regressions-with-tests-and-docs-sync.md) | Completed |

## Dependencies

- Existing TUI runtime in `src/tui/*` remains the only presentation layer
- No new dependency or terminal framework should be introduced
- Plain CLI behavior must remain unchanged unless copy updates explicitly apply there too

## Success Criteria

- The shell renders centered on wide terminals instead of hugging the left edge
- Home and nested content frames no longer show crooked borders or clipped right edges like the current hero box
- No user-facing TUI or docs copy uses `Pokemon`, `Pokedex`, or similar borrowed branding
- TUI regression tests cover centered layout behavior and normalized view content

## Risks

- Hardcoded inner widths in views can keep content visually off even after the shell is centered
- Over-centering vertically can make the app feel unstable during resize; keep vertical positioning conservative
- Copy cleanup can miss docs/tests if search-and-replace is done loosely

## Implementation Notes

- Prefer one layout contract owned by `src/tui/render-layout.js` plus helpers instead of per-view spacing hacks
- Replace hand-drawn nested boxes that assume a fixed width with layout-safe text blocks or helper-generated boxes
- Treat copy cleanup as product language work, not cosmetic search-replace; wording should match `cb-zoo`, Claude buddies, and collection/archive concepts
- Delivered centered shell metrics, width-aware view rendering, narrow-terminal regression coverage, archive-specific status copy, and synced evergreen docs
