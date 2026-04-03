---
title: "Configurable breed hatch times and multi-slot breeding"
description: "Move egg hatch timers and breed slot count into settings.json, then migrate single-egg breeding to configurable slot-based persistence."
status: completed
priority: P1
effort: 6h
branch: main
tags: [breed, settings, config, tui, persistence]
blockedBy: []
blocks: []
created: 2026-04-03
---

# Configurable Breed Hatch Times and Slots

## Overview

- Move current hardcoded hatch times into `~/.cb-zoo/settings.json`.
- Replace the single persisted `breedEgg` model with configurable slot-based breeding.
- Default to `3` breed slots, but keep the slot count user-configurable in `settings.json`.
- Preserve the current resumable/incubating/hatched egg behavior across restarts.

## Status Summary

- Overall status: Completed
- Completed phases: 4 of 4
- Remaining work: None
- Verification: `npm test`, `npm run test:coverage`, `npm run check`, and `npm run smoke` passed on 2026-04-03
- Blockers: None
- Prior related work: [260403-1901-breed-feature](../260403-1901-breed-feature/plan.md)

## Phases

1. [Phase 01 - Settings Schema and Migration](./phase-01-settings-schema-and-migration.md) - completed
2. [Phase 02 - Shared Breed Config and Slot Domain](./phase-02-shared-breed-config-and-slot-domain.md) - completed
3. [Phase 03 - TUI Slot Flow and Navigation](./phase-03-tui-slot-flow-and-navigation.md) - completed
4. [Phase 04 - Tests and Docs Sync](./phase-04-tests-and-docs-sync.md) - completed

## Key Decisions

- New persisted config lives inside `settings.json`:
  - `breedConfig.slotCount`
  - `breedConfig.hatchTimes.common|uncommon|rare|epic|legendary`
- New persisted egg state becomes `breedSlots`, an ordered array of `null | BreedEgg`.
- Legacy `breedEgg` migrates into `breedSlots[0]` on first load.
- If the user lowers `slotCount`, occupied overflow slots are preserved until cleared; new eggs cannot start beyond configured capacity.
- Home and breed UI must surface slot state explicitly because single-egg labels like `View Egg` and `Hatch Egg` no longer scale.

## Success Criteria

- Users can tune hatch timers and slot count directly in `~/.cb-zoo/settings.json`.
- Up to the configured slot count eggs can incubate concurrently.
- Existing installs with one persisted egg migrate without data loss.
- Ready and incubating eggs stay resumable after leaving the screen or restarting the app.
- `npm test`, `npm run test:coverage`, `npm run check`, and `npm run smoke` pass after implementation.
