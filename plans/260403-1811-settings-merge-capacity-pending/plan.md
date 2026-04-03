---
title: "Unified settings.json, collection capacity, and pending buddy state"
description: "Replace backup.json with settings.json holding backup/maxBuddy/pendingBuddy, enforce collection capacity in TUI, and persist rolled-but-unsaved buddies across restarts"
status: completed
priority: P1
effort: 4h
branch: main
tags: [settings, collection, tui, persistence]
blockedBy: []
blocks: []
created: 2026-04-03
---

# Unified Settings, Collection Capacity & Pending Buddy

## Overview

Three tightly coupled features sharing the same new persistence layer:

1. **Unified settings.json** — replaces `backup.json`, homes `maxBuddy` and `pendingBuddy`
2. **Collection capacity** — TUI shows count/max, blocks add/equip when full
3. **Pending buddy** — persisted to disk, survives restart, resumable from roll screen

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Settings manager module + migration | completed | [phase-01](phase-01-settings-manager.md) |
| 2 | Wire uuid-manager and collection to settings | completed | [phase-02](phase-02-wire-uuid-collection.md) |
| 3 | Pending buddy state in TUI | completed | [phase-03](phase-03-pending-buddy-tui.md) |
| 4 | Collection capacity display + enforcement | completed | [phase-04](phase-04-collection-capacity.md) |
| 5 | Tests | completed | [phase-05](phase-05-tests.md) |

## Key Decisions

- Single `~/.cb-zoo/settings.json` replaces `backup.json`
- Auto-migrate `backup.json` → `settings.json` on first load
- `maxBuddy` default: 50
- `pendingBuddy` persisted to disk, cleared on equip/add
- Back from roll keeps pending buddy (resumable)
- Collection full → add/equip disabled, reroll still works
