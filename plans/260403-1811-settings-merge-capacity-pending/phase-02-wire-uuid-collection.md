# Phase 2: Wire uuid-manager and collection to settings

## Context
- Depends on: [Phase 1](phase-01-settings-manager.md)
- `src/uuid-manager.js` directly reads/writes `backup.json` — must switch to settings-manager
- `src/collection.js` has no capacity check — needs `getMaxBuddy()`
- `src/cli.js` imports `backupUuid`, `restoreUuid` from uuid-manager — signatures must stay stable

## Overview
- **Priority:** P0
- **Status:** completed
- Refactor `uuid-manager.js` to use `settings-manager` for all backup operations
- Add capacity check to `collection.js:saveToCollection()`
- CLI flags `--backup` / `--restore` continue working unchanged

## Related Code Files

### Modify
- `src/uuid-manager.js` — replace direct backup.json I/O with settings-manager calls
- `src/collection.js` — add maxBuddy capacity check in `saveToCollection()`

### Read for context
- `src/cli.js` — verify CLI flag contracts unchanged
- `src/claude-state.js` — `readJsonFile`, `isUuid` imports

## Implementation Steps

### uuid-manager.js changes

1. **Remove** direct `backup.json` reads — drop `readValidBackup()` internal usage for backup file, `getBackupFile` import.

2. **Import** `getBackupData`, `setBackupData` from `settings-manager.js`.

3. **`hasBackup()`** — rewrite:
   ```js
   export function hasBackup() {
     return getBackupData() !== null;
   }
   ```

4. **`backupUuid()`** — rewrite:
   ```js
   export function backupUuid() {
     const existing = getBackupData();
     if (existing) {
       return { created: false, uuid: existing.uuid };
     }
     const { configFile: stateFile, config } = resolveClaudeState({ requireWritableConfig: true });
     const uuid = getUuidFromConfig(config);
     const backup = { uuid, stateFile, backedUpAt: new Date().toISOString() };
     setBackupData(backup);
     return { created: true, filePath: getSettingsFile(), uuid, stateFile };
   }
   ```
   Note: `filePath` in return now points to `settings.json`. Check callers — `cli.js` uses it in a log message. Acceptable change.

5. **`restoreUuid()`** — rewrite:
   ```js
   export function restoreUuid() {
     const backup = getBackupData();
     if (!backup || !isUuid(backup.uuid)) {
       throw new Error("No valid backup found. Run cb-zoo --backup first.");
     }
     // stateFile validation stays same
     return applyUuid(backup.uuid, backup.stateFile ? { configFile: backup.stateFile } : undefined);
   }
   ```

6. **Remove** `readValidBackup()` function entirely (dead code after refactor). Keep `writeJsonFile()` — still used by `applyUuid()` and `updateCompanionMetadata()`.

7. **Remove** `ensureDataDir()` call from `backupUuid()` — `saveSettings()` in settings-manager handles dir creation.

### collection.js changes

8. **Import** `getMaxBuddy` from `settings-manager.js`.

9. **`saveToCollection()`** — add capacity check before push:
   ```js
   const maxBuddy = getMaxBuddy();
   if (entries.length >= maxBuddy) {
     throw new Error(`Collection full (${entries.length}/${maxBuddy}). Delete a buddy first.`);
   }
   ```

## Todo

- [x] Refactor hasBackup() to use getBackupData()
- [x] Refactor backupUuid() to use setBackupData()
- [x] Refactor restoreUuid() to use getBackupData()
- [x] Remove dead readValidBackup() usage for backup file
- [x] Add maxBuddy capacity check in saveToCollection()
- [x] Verify --backup and --restore CLI flags still work

## Success Criteria
- `--backup` creates backup data inside `settings.json`
- `--restore` reads backup from `settings.json`
- `saveToCollection()` throws when collection at capacity
- No references to `backup.json` remain in uuid-manager.js
- All existing tests pass (after updating test helpers)

## Risks
| Risk | Mitigation |
|------|------------|
| `backupUuid()` return shape changes | `filePath` now points to settings.json — only used in log messages, acceptable |
| `readValidBackup` still needed elsewhere | Grep for all callers — only in uuid-manager.js |
