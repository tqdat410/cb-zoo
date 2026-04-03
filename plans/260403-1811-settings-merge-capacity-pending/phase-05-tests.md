# Phase 5: Tests

## Context
- Depends on: [Phase 1-4](plan.md)
- Test framework: `node:test` + `node:assert/strict`
- Existing pattern: `withTempEnvironment()` in `test/integration-flows.test.js` sets `CB_ZOO_DATA_DIR` env
- Settings file lands in `CB_ZOO_DATA_DIR` directory

## Overview
- **Priority:** P1
- **Status:** completed
- Update existing tests that reference backup.json
- Add new tests for settings-manager, migration, capacity, pending buddy

## Related Code Files

### Modify
- `test/integration-flows.test.js` — update backup tests, add settings/migration tests

### Create
- `test/settings-manager.test.js` — dedicated settings-manager unit tests

## Test Cases

### settings-manager.test.js

1. **loadSettings() returns defaults** when no files exist
2. **loadSettings() reads existing settings.json** with all fields
3. **loadSettings() fills missing fields** with defaults (e.g., old settings.json without `pendingBuddy`)
4. **Migration from backup.json** — backup.json exists, no settings.json → migrates, deletes backup.json
5. **Migration skipped** when settings.json already exists (even if backup.json also exists)
6. **saveSettings() atomic write** — settings.json updated
7. **getBackupData/setBackupData** round-trip
8. **getMaxBuddy** returns default 50
9. **getPendingBuddy/setPendingBuddy/clearPendingBuddy** round-trip
10. **Invalid pendingBuddy shape** on load → treated as null

### integration-flows.test.js updates

11. **Update existing backup tests** to verify backup data lives in settings.json
12. **backupUuid() creates settings.json** (not backup.json)
13. **restoreUuid() reads from settings.json**
14. **Collection capacity** — saveToCollection throws when at limit
15. **Collection capacity** — saveToCollection works when under limit

### tui-controller.test.js updates (if applicable)

16. **Pending buddy resume** — mock getPendingBuddy to return buddy, verify roll screen entered with revealed state
17. **Pending buddy clear on equip** — verify clearPendingBuddy called

## Implementation Steps

1. Create `test/settings-manager.test.js` with `withTempEnvironment` pattern
2. Write unit tests for load/save/migrate/accessors
3. Update `test/integration-flows.test.js` backup-related tests
4. Add capacity enforcement tests
5. Run full suite: `node --test`

## Todo

- [x] Create settings-manager.test.js
- [x] Test loadSettings defaults, read, fill missing
- [x] Test migration from backup.json
- [x] Test atomic write
- [x] Test accessor round-trips
- [x] Update integration backup tests
- [x] Test collection capacity enforcement
- [x] Run full test suite green

## Success Criteria
- All new tests pass
- All existing tests pass (updated for settings.json)
- `node --test` exits 0
- Coverage doesn't regress
