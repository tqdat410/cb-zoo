# Phase 1: Settings Manager Module + Migration

## Context
- Brainstorm: [brainstorm report](../reports/brainstorm-260403-1811-settings-merge-capacity-pending.md)
- Current backup logic: `src/uuid-manager.js` reads/writes `~/.cb-zoo/backup.json` directly
- Config paths: `src/config.js` exports `BACKUP_FILE`, `getBackupFile()`

## Overview
- **Priority:** P0 — all other phases depend on this
- **Status:** completed
- Create `src/settings-manager.js` (~80 LOC) as the single read/write layer for `~/.cb-zoo/settings.json`
- Update `src/config.js` to export `getSettingsFile()` / `SETTINGS_FILE` instead of backup equivalents

## Schema

```json
{
  "backup": {
    "uuid": "00000000-0000-4000-8000-000000000000",
    "stateFile": "~/.claude.json",
    "backedUpAt": "2026-04-03T12:00:00.000Z"
  },
  "maxBuddy": 50,
  "pendingBuddy": null
}
```

- `backup` — nullable object, same shape as current `backup.json` contents
- `maxBuddy` — positive integer, default 50
- `pendingBuddy` — nullable buddy object (uuid, species, rarity, eye, hat, shiny, total, rolledAt)

## Key Insights
- `uuid-manager.js:readValidBackup()` already validates UUID shape — reuse via import
- Atomic write pattern (tmp + rename) already used in `uuid-manager.js` and `collection.js` — extract or duplicate
- `config.js` exports `BACKUP_FILE` as a module-level constant — must replace with `SETTINGS_FILE`

## Requirements

### Functional
- `loadSettings()` — returns full settings object with defaults for missing fields
- `saveSettings(settings)` — atomic write
- `migrateFromBackup()` — if `backup.json` exists and `settings.json` doesn't, merge and delete old file
- `getBackupData()` / `setBackupData(backup)` — backup accessors
- `getMaxBuddy()` — returns maxBuddy value
- `getPendingBuddy()` / `setPendingBuddy(buddy)` / `clearPendingBuddy()` — pending accessors
- Migration runs automatically inside `loadSettings()` when needed

### Non-functional
- Zero new dependencies
- Atomic writes (tmp file + rename)
- Validate settings shape on load, use defaults for missing/invalid fields

## Related Code Files

### Modify
- `src/config.js` — replace `getBackupFile()`/`BACKUP_FILE` with `getSettingsFile()`/`SETTINGS_FILE`

### Create
- `src/settings-manager.js`

## Implementation Steps

1. **config.js** — Rename `getBackupFile()` → `getSettingsFile()`, change filename from `backup.json` to `settings.json`. Keep `getBackupFile()` as internal helper for migration only (reads old path). Export `SETTINGS_FILE` instead of `BACKUP_FILE`.

2. **settings-manager.js** — Create module:
   ```
   Constants: DEFAULT_MAX_BUDDY = 50, BUDDY_FIELDS
   
   loadSettings()
     → if settings.json exists, read + validate + fill defaults
     → else if backup.json exists, migrateFromBackup()
     → else return defaults { backup: null, maxBuddy: 50, pendingBuddy: null }
   
   saveSettings(settings)
     → atomic write (tmp + rename) to settings.json
   
   migrateFromBackup()
     → read backup.json
     → write settings.json with { backup: backupData, maxBuddy: 50, pendingBuddy: null }
     → delete backup.json (unlinkSync)
     → return merged settings
   
   getBackupData() → loadSettings().backup
   setBackupData(backup) → load, mutate, save
   getMaxBuddy() → loadSettings().maxBuddy
   getPendingBuddy() → loadSettings().pendingBuddy
   setPendingBuddy(buddy) → load, set, save
   clearPendingBuddy() → load, null, save
   ```

3. Validate `pendingBuddy` shape on load using same fields as `collection.js:isCollectionEntry()` — reuse or inline the check.

## Todo

- [x] Rename config.js backup exports → settings exports
- [x] Create src/settings-manager.js with load/save/migrate
- [x] Validate pendingBuddy shape matches collection entry shape
- [x] Atomic write with tmp + rename
- [x] Auto-migration from backup.json on first load

## Success Criteria
- `loadSettings()` returns valid object with all three fields
- Existing `backup.json` files migrate transparently on first call
- After migration, `backup.json` is deleted and `settings.json` exists
- Invalid/missing fields fall back to defaults without crashing

## Risks
| Risk | Mitigation |
|------|------------|
| `backup.json` deleted before `settings.json` written | Write settings first, then delete backup |
| Concurrent processes reading during migration | Atomic write; check existence before delete |
