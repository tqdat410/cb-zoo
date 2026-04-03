# Phase 01: Settings Schema and Migration

## Context Links

- [Overview Plan](./plan.md)
- [Existing breed plan](../260403-1901-breed-feature/plan.md)
- [src/settings-manager.js](../../src/settings-manager.js)
- [src/config.js](../../src/config.js)

## Overview

- Priority: P1
- Status: Completed
- Goal: make `settings.json` the single source of truth for hatch-time tuning and breed-slot capacity without losing legacy persisted eggs.

## Key Insights

- Current hatch timings are hardcoded in `src/config.js` as `EGG_HATCH_TIMES`.
- Current persisted breed state is a single `settings.breedEgg`.
- `settings-manager.js` already owns config normalization and migration, so this change should stay centered there.

## Requirements

- Add `breedConfig.slotCount` as a positive integer with default `3`.
- Add `breedConfig.hatchTimes` as positive integer millisecond values for all five rarities.
- Replace singleton `breedEgg` persistence with `breedSlots`.
- Auto-migrate legacy `breedEgg` into slot `0`.
- Preserve occupied slots even when user lowers configured slot count below the stored occupied-slot count.

## Architecture

- Extend settings normalization with a new `breedConfig` block.
- Introduce `breedSlots` as persisted state:
  - `null` slot = empty incubator
  - object slot = same egg payload currently validated by `isBreedEgg`
- Keep `rollConfig`, `rollCharges`, `pendingBuddy`, and backup behavior unchanged.
- Derive an effective visible slot count from:
  - configured `breedConfig.slotCount`
  - plus any occupied overflow slots that must not be dropped

## Related Code Files

- Modify:
  - `src/settings-manager.js`
  - `src/config.js`
  - `test/settings-manager.test.js`
  - `test/integration-flows.test.js`
- Create:
  - none unless settings normalization needs extraction for size control
- Delete:
  - none

## Implementation Steps

1. Add default breed config constants for slot count and per-rarity hatch times.
2. Normalize and strictly validate `breedConfig` inside settings load/save paths.
3. Normalize persisted `breedSlots` arrays and keep invalid entries fail-closed.
4. Migrate legacy `breedEgg` into `breedSlots[0]` when present.
5. Ensure save paths never silently truncate occupied overflow slots.
6. Add settings/integration coverage for defaults, migration, invalid config, and slot preservation.

## Todo List

- [x] Define default `breedConfig`
- [x] Add `breedSlots` normalization and storage
- [x] Add legacy `breedEgg` migration
- [x] Handle reduced `slotCount` without data loss
- [x] Add settings-focused regression tests

## Success Criteria

- `loadSettings()` returns valid defaults when `breedConfig` is missing.
- Legacy single-egg state reappears in slot `0`.
- Invalid `breedConfig` and invalid slot payloads fail closed without crashing unrelated flows.
- No occupied egg is lost just because `slotCount` was lowered manually.

## Risk Assessment

- Highest risk is silent egg loss during migration or normalization.
- Second risk is letting stored slot count and array length drift into inconsistent UI assumptions.

## Security Considerations

- Treat edited `settings.json` as untrusted input.
- Keep all new numeric config values validated as positive integers before use.
- Preserve existing temp-file and atomic-write guarantees.

## Next Steps

- Feed normalized slot and timer data into breed domain helpers and TUI flow logic in Phase 02.
