# Phase 02: Shared Breed Config and Slot Domain

## Context Links

- [Overview Plan](./plan.md)
- [Phase 01](./phase-01-settings-schema-and-migration.md)
- [src/tui/breed-flow.js](../../src/tui/breed-flow.js)
- [src/tui/breed-state.js](../../src/tui/breed-state.js)
- [src/roll-charge-manager.js](../../src/roll-charge-manager.js)

## Overview

- Priority: P1
- Status: Completed
- Goal: remove singleton-egg assumptions from shared breed logic and make hatch timing read from normalized settings instead of hardcoded constants.

## Key Insights

- `beginEgg()` currently derives `hatchAt` from `EGG_HATCH_TIMES[state.breed.offspringTraits.rarity]`.
- `openBreedFlow()`, `hatchEgg()`, `isEggReady()`, and `setBreedEgg()/clearBreedEgg()` all assume exactly one egg exists.
- Current in-memory breed state has no concept of an active slot index.

## Requirements

- Allow concurrent eggs up to configured capacity.
- Resolve hatch readiness and hatched-buddy persistence per slot.
- Keep existing `hatchedUuid` behavior per egg.
- Avoid changing CLI commands; scope stays inside settings-backed breed behavior and TUI.

## Architecture

- Introduce slot-aware settings helpers, likely along these lines:
  - `getBreedConfig()`
  - `getBreedSlots()`
  - `getBreedSlot(index)`
  - `setBreedSlot(index, egg)`
  - `clearBreedSlot(index)`
  - `isBreedSlotReady(index)`
- Extend in-memory breed state with:
  - `slotIndex`
  - `slots`
  - slot-summary data for the picker
- Move hatch-time lookup to normalized `settings.breedConfig.hatchTimes`.
- Keep UUID hunting, lineage, and hatch Add/Equip/Delete semantics unchanged per slot.

## Related Code Files

- Modify:
  - `src/settings-manager.js`
  - `src/tui/breed-flow.js`
  - `src/tui/breed-state.js`
  - `test/tui-breed-flow.test.js`
  - `test/breed-engine.test.js` if shared helpers move there
- Create:
  - optional small helper module only if `settings-manager.js` becomes harder to maintain
- Delete:
  - none

## Implementation Steps

1. Replace singleton breed helpers with slot-aware read/write helpers.
2. Thread `slotIndex` through egg creation, incubation resume, hatch resume, and clear paths.
3. Read hatch duration from `breedConfig.hatchTimes[rarity]`.
4. Keep `hatchedUuid` persisted on the chosen slot only.
5. Ensure timer cleanup and resume logic still work when multiple eggs exist but only one slot is active onscreen.

## Todo List

- [x] Add slot-aware breed settings helpers
- [x] Add active-slot state to the TUI breed state object
- [x] Replace hardcoded hatch-time map usage
- [x] Preserve per-slot `hatchedUuid` resume behavior
- [x] Regression-test slot-aware breed flow internals

## Success Criteria

- New eggs start in the chosen slot and only mutate that slot.
- Opening an occupied slot resumes the correct incubating or ready egg.
- Hatch timers follow values from `settings.json`, not hardcoded constants.
- Timer cleanup remains correct when leaving breed screens.

## Risk Assessment

- Biggest risk is stale state leaking across slots, especially around `hatchedBuddy`, timer ownership, and rollback after failed Equip.
- Another risk is accidental reuse of slot `0` assumptions in helper or render code.

## Security Considerations

- All slot indices must be bounds-checked against effective slot state before reads or writes.
- Failed add/equip flows must still preserve the ready egg in its original slot.

## Next Steps

- Build the slot picker and updated breed navigation on top of the slot-aware domain in Phase 03.
