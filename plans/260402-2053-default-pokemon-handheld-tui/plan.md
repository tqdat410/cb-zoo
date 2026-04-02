---
title: "Make cb-zoo a default Pokemon handheld TUI"
description: "Replace the current interactive CLI flow with a lightweight default TUI styled like a Pokemon handheld while preserving scriptable fallbacks."
status: completed
priority: P1
effort: 10h
branch: main
tags: [tui, terminal-ui, ascii, gacha, pokemon-handheld]
blockedBy: []
blocks: []
created: 2026-04-02
---

# Make cb-zoo a default Pokemon handheld TUI

## Overview

Convert `cb-zoo` from a flag-driven ANSI CLI into a lightweight default TUI for interactive use. The new UI should feel like a Pokemon handheld: framed shell, richer ASCII presentation, simple gacha animation, and unified navigation for roll/current/collection/edit flows. Non-interactive usage and testability must remain intact.

## Brainstorm Reference

- [Brainstorm Summary](../reports/brainstorm-260402-2053-default-pokemon-handheld-tui.md)

## Status Summary

- Overall status: Completed
- Phase progress: 5/5 phases complete
- Docs impact: major
- UX impact: major
- Validation: `npm test`, `npm run test:coverage`, and docs validation passed on 2026-04-02

## Context Links

- [README](../../README.md)
- [System architecture](../../docs/system-architecture.md)
- [Code standards](../../docs/code-standards.md)
- [Current companion edit plan](../260402-2022-edit-current-companion-name-and-personality/plan.md)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Define TUI contract, modes, and Pokemon handheld visual rules](./phase-01-define-tui-contract-modes-and-pokemon-handheld-visual-rules.md) | Completed |
| 2 | [Build terminal runtime primitives and navigation shell](./phase-02-build-terminal-runtime-primitives-and-navigation-shell.md) | Completed |
| 3 | [Implement roll view, reveal animation, and action flows](./phase-03-implement-roll-view-reveal-animation-and-action-flows.md) | Completed |
| 4 | [Implement current, collection, and edit views with shared layout](./phase-04-implement-current-collection-and-edit-views-with-shared-layout.md) | Completed |
| 5 | [Add fallback modes, regression coverage, and docs sync](./phase-05-add-fallback-modes-regression-coverage-and-docs-sync.md) | Completed |

## Dependencies

- Existing business logic modules remain the source of truth for rolling, persistence, and Claude state mutation
- TUI must degrade cleanly when stdout/stdin is not a usable TTY
- No dependency should be added unless a later review proves the custom runtime is failing the simplicity test

## Success Criteria

- Interactive `node ./src/cli.js` launches the TUI by default
- Home, roll, current, collection, and edit flows exist inside one consistent shell
- Gacha animation remains simple, deterministic in feel, and visually stronger than the current reveal
- Current automation and non-interactive tests remain possible without needing a full terminal emulator
- Documentation reflects the new default experience and fallback behavior

## Risks

- Raw ANSI lifecycle bugs: hidden cursor, bad cleanup, partial redraws
- Tight coupling between input handling and render logic can make bugs hard to reason about
- Scope creep toward a full terminal framework will slow delivery
- Existing tests focus on CLI functions, not view state or screen output

## Implementation Notes

- Keep domain logic in existing modules; add a presentation layer instead of rewriting everything into the TUI
- Prefer view-local pure render functions that return strings over imperative writes sprinkled across the app
- Use the current CLI flags as escape hatches and fallback interfaces during migration
- Treat non-TTY and piped stdin behavior as first-class, not afterthoughts
- Delivered runtime in `src/tui/*`, launch routing in `src/launch-mode.js`, TTY default entry in `src/cli.js`, focused TUI tests, and docs updates for the new default mode
