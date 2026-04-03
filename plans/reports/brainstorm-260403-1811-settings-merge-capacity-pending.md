# Brainstorm: Settings Merge + Collection Capacity + Pending Roll

**Date:** 2026-04-03  
**Status:** Approved

## Problem Statement

Three related gaps in cb-zoo's data layer:
1. No unified settings file — backup.json is standalone, no place for user config
2. Collection has no capacity limit — unbounded growth
3. Rolled buddies are lost if user navigates away without add/equip — no pending state

## Evaluated Approaches

### File Layout

| Approach | Pros | Cons |
|----------|------|------|
| **Single unified settings.json** (chosen) | One file to read/write, simpler migration, natural home for future config | Slightly larger atomic writes |
| Two separate files | Separation of concerns | Extra file I/O, cross-file consistency risk, more code |

### Pending Buddy Storage

| Approach | Pros | Cons |
|----------|------|------|
| **Persist to settings.json** (chosen) | Survives app restart, resumable | Disk write on every roll |
| Memory only | Simple, no I/O | Lost on exit, poor UX |

### Collection Full Behavior

| Approach | Pros | Cons |
|----------|------|------|
| **Block add, default 50** (chosen) | Clear feedback, generous default | User must delete before adding |
| Force replace | No blocking | Confusing UX, accidental loss |

## Final Design

### 1. Unified settings.json

```
~/.cb-zoo/settings.json
{
  "backup": { "uuid": "...", "stateFile": "...", "backedUpAt": "..." },
  "maxBuddy": 50,
  "pendingBuddy": { "uuid": "...", "species": "...", ... } | null
}
```

- Replaces `backup.json`
- Migration: if `backup.json` exists on first load, merge into `settings.json`, delete old file
- Defaults: `maxBuddy=50`, `pendingBuddy=null`

### 2. New Module: src/settings-manager.js (~80 LOC)

- `loadSettings()` — read settings.json, run migration if needed, return object
- `saveSettings(settings)` — atomic write (tmp + rename)
- `migrateFromBackup()` — one-time backup.json → settings.json migration
- Accessors: `getBackup/setBackup`, `getMaxBuddy`, `getPendingBuddy/setPendingBuddy/clearPendingBuddy`

### 3. Files Changed

| File | Change |
|------|--------|
| `src/config.js` | `getSettingsFile()` replaces `getBackupFile()`, export `SETTINGS_FILE` |
| `src/uuid-manager.js` | Use settings-manager for all backup read/write ops |
| `src/collection.js` | `saveToCollection()` checks `maxBuddy` capacity, throw if full |
| `src/tui/state.js` | Load `pendingBuddy` from settings on init |
| `src/tui/views/collection-view.js` | Show `3/50` count in subtitle/status |
| `src/tui/views/roll-view.js` | Pending indicator when resuming |
| `src/tui/roll-flow.js` | Persist `pendingBuddy` on roll, clear on equip/add |
| `src/tui/controller.js` | Resume pending on roll screen entry, block add/equip when full |
| `src/tui/views/home-view.js` | Show indicator if pending buddy exists |

### 4. Roll Pending Flow

- **Roll** → save buddy to `settings.pendingBuddy`
- **Equip/Add** → clear `pendingBuddy` from settings
- **Back** → `pendingBuddy` stays persisted (resumable)
- **Reroll** → overwrite old pending with new buddy
- **App relaunch** → if `pendingBuddy` exists, resume roll-revealed screen

### 5. Collection Full Behavior

- Add/Equip disabled when `collection.length >= maxBuddy`
- Status message: `"Collection full (50/50). Delete a buddy first."`
- Reroll still works — just can't save result
- Collection view subtitle: `"3/50 buddies"`

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Existing users have backup.json | Auto-migration on first settings load |
| Corrupt settings.json | Atomic write (tmp + rename), validation on read |
| pendingBuddy stale after manual file edit | Validate buddy shape on load, clear if invalid |

## Success Criteria

- [x] `backup.json` migrated to `settings.json` transparently
- [ ] `--backup` / `--restore` CLI flags work unchanged
- [ ] Collection shows count/capacity in TUI
- [ ] Add/Equip blocked when collection full
- [ ] Pending buddy persists across app restarts
- [ ] Back from roll keeps pending buddy resumable
