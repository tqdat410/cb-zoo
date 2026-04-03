# Phase 1: Settings Schema And Charge State

## Context Links

- [Overview plan](./plan.md)
- [Code standards](../../docs/code-standards.md)
- [System architecture](../../docs/system-architecture.md)

## Overview

- Priority: High
- Status: Completed
- Goal: keep roll tuning and mutable charge state inside the existing single `settings.json` storage path.

## Key Insights

- The shipped implementation kept the single-file storage model instead of introducing a second config module.
- `settings-manager.js` grew, but the added roll helpers stayed scoped under `rollConfig` and `rollCharges` so the file still owns one clear concern: persisted app settings.

## Requirements

- Support `settings.rollConfig.maxCharges` with default `100`.
- Support `settings.rollConfig.regenMs` with default `300000`.
- Persist mutable charge inventory in the same `settings.json` file.
- Keep legacy settings loads backward compatible when roll fields are missing.
- Let read-only tolerant loads backfill invalid roll payloads to defaults, while strict roll-backed flows fail closed on invalid persisted data.

## Architecture

- `src/settings-manager.js` now defines `DEFAULT_MAX_ROLL_CHARGES` and `DEFAULT_ROLL_REGEN_MS`.
- `normalizeRollConfig()` validates positive integer `maxCharges` and `regenMs`.
- `normalizeRollChargesWithOptions()` initializes missing charge state to `{ available: maxCharges, updatedAt: now }` and clamps stored counts to the current max.
- `saveSettings()` persists `rollConfig` and `rollCharges` through the existing atomic temp-file write path.
- Accessors `getRollConfig()`, `getRollCharges()`, and `setRollCharges()` were added on top of the existing settings API.

## Related Code Files

- Modify:
  - `src/settings-manager.js`
- Create:
  - None.
- Delete:
  - None.

## Shipped Implementation

1. Added roll-config defaults and validation helpers inside `settings-manager.js`.
2. Extended normalized settings shape with `rollConfig` and `rollCharges`.
3. Added strict accessors for charge config/state plus a writer for updated charge inventory.
4. Preserved old `settings.json` compatibility by lazily defaulting missing roll data on normal load.

## Todo List

- [x] Add settings rollConfig defaults
- [x] Add settings roll-charge schema
- [x] Add strict invalid-settings handling

## Success Criteria

- Existing `settings.json` files missing roll fields load with sane defaults.
- Strict roll-backed reads reject malformed persisted roll payloads before side effects.
- Existing users with old `settings.json` still load without manual migration.
- Roll config and charge state stay in the same settings file as backup, pending roll, and breed egg state.

## Risk Assessment

- Main risk was turning `settings-manager.js` into an unreadable catch-all.
- Mitigation shipped: keep new logic narrowly scoped to roll helpers and reuse the existing atomic save pipeline instead of adding another storage layer.

## Security Considerations

- `settings.json` stays treated as untrusted JSON.
- Atomic temp-file writes remain in place for settings mutations.
- cb-zoo state stays outside Claude-owned protected directories.

## Next Steps

- Phase complete. Shared refill math landed in Phase 2.
