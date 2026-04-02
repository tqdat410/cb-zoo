---
title: "Refine TUI roll controls, collection save timing, and rarity styling"
description: "Remove auto-save on roll reveal, add explicit Add/Equip actions, and restyle the handheld roll UI with rarity-specific accents."
status: completed
priority: P1
effort: 4h
branch: main
tags: [tui, roll-flow, collection, rarity, ux]
blockedBy: []
blocks: []
created: 2026-04-02
---

# Refine TUI roll controls, collection save timing, and rarity styling

## Overview

Adjust the handheld TUI so rolling no longer auto-adds buddies to the collection, reroll exposes a dedicated `Add` action, `Equip` both saves and applies the buddy, the shell drops the flat blue background, and rarity feedback uses stronger Claude-style color/star accents. Keep the existing no-dependency runtime and safety rules intact.

## Status Summary

- Overall status: Completed
- Phase progress: 3/3 phases complete
- Docs impact: minor
- UX impact: major
- Validation: `npm test` passed on 2026-04-02 with 68/68 tests passing

## Context Links

- [README](../../README.md)
- [Code standards](../../docs/code-standards.md)
- [System architecture](../../docs/system-architecture.md)
- [Default handheld TUI plan](../260402-2053-default-pokemon-handheld-tui/plan.md)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Restyle handheld shell and rarity presentation](./phase-01-restyle-handheld-shell-and-rarity-presentation.md) | Completed |
| 2 | [Redesign roll state, actions, and manual collection writes](./phase-02-redesign-roll-state-actions-and-manual-collection-writes.md) | Completed |
| 3 | [Expand TUI controls coverage and sync docs](./phase-03-expand-tui-controls-coverage-and-sync-docs.md) | Completed |

## Dependencies

- Existing buddy generation, backup, and UUID apply logic remain source of truth
- Collection persistence must still reject corrupt files before any mutation
- TUI still has to degrade cleanly in non-interactive or plain CLI paths

## Success Criteria

- Roll reveal does not write `collection.json` until the user chooses `Add` or `Equip`
- `Equip` saves the rolled buddy then applies its UUID in the same action
- Roll screen shows explicit action buttons such as `Equip`, `Add`, `Reroll`, and `Back`
- Handheld frame no longer paints a solid blue terminal background
- Rarity labels and star accents are visibly differentiated and consistent across the roll UI
- Regression tests cover the new action semantics and renderer output

## Risks

- Changing save timing can accidentally skip collection sync or double-save the same roll
- New action state can become inconsistent across reroll, escape, and error paths
- ANSI styling changes can break width calculations if new color wrappers are not kept isolated
- "Claude Code" rarity palette is partially inferential unless matched against an explicit source

## Implementation Notes

- Prefer updating existing TUI modules directly instead of adding new layers unless a file crosses the project size threshold
- Keep action definitions centralized so controller, roll flow, and renderer all use the same ordering and labels
- Treat "added" as per-roll transient state, not global dedupe logic
- Preserve plain CLI behavior unless the same manual-save semantics are intentionally adopted later in a separate task
- Delivered in existing TUI modules: shared rarity accents in render helpers, explicit `Equip`/`Add`/`Reroll`/`Back` actions, save-once roll state, updated TUI coverage, and synced README/roadmap/changelog copy

## Unresolved Questions

- None.
