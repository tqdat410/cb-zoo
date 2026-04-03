# Phase 2: Shared Roll-Charge Domain Service

## Context Links

- [Overview plan](./plan.md)
- [Phase 1](./phase-01-config-file-and-charge-state.md)
- [Codebase summary](../../docs/codebase-summary.md)

## Overview

- Priority: High
- Status: Completed
- Goal: centralize refill math, availability snapshots, and countdown formatting so CLI and TUI stay aligned on charge state.

## Key Insights

- Plain/quick CLI and TUI both need the same lazy refill math and zero-charge messaging.
- The shipped TUI path still needed one inline commit path so `rollCharges` and `pendingBuddy` can be saved together atomically.
- Resume-pending-roll stays outside charge consumption.

## Requirements

- Expose a shared snapshot API with `available`, `maxCharges`, `regenMs`, `nextRefillAt`, `msUntilNext`, and `isFull`.
- Expose a shared consume API for brand-new CLI rolls.
- Lazily regenerate charges from elapsed time without background timers.
- Clamp stored availability when config max shrinks.
- Provide a single countdown formatter for CLI and TUI copy.

## Architecture

- `src/roll-charge-manager.js` was added.
- `getRollChargeSnapshot()` loads strict settings, applies lazy refill math, and returns normalized UI-ready state.
- `formatRollCountdown()` standardizes `mm:ss` and `h:mm:ss` countdown copy.
- `consumeRollCharge()` spends one charge for CLI entrypoints and throws the shared `No rolls left. Next +1 in ...` error at zero.
- TUI reuses snapshot and countdown helpers, but writes the decremented charge state together with `pendingBuddy` inside `saveSettings()` rather than calling the consume helper separately.

## Related Code Files

- Create:
  - `src/roll-charge-manager.js`
- Modify:
  - `src/settings-manager.js`
- Delete:
  - None.

## Shipped Implementation

1. Added pure snapshot creation plus countdown formatting inside `roll-charge-manager.js`.
2. Exposed `getRollChargeSnapshot()` for shared CLI/TUI reads.
3. Exposed `consumeRollCharge()` for CLI brand-new roll entrypoints.
4. Locked config-shrink clamping through settings normalization.
5. Kept rollback semantics explicit:
   - CLI refunds the charge if reveal flow fails before the post-reveal prompt.
   - TUI avoids charge burn on pending-save failure by committing charge spend and `pendingBuddy` together in one settings write.

## Todo List

- [x] Add normalized snapshot API
- [x] Add consume API
- [x] Add countdown formatter/helper
- [x] Document config-change clamp behavior
- [x] Lock rollback semantics

## Success Criteria

- Refill math lives in one place.
- CLI and TUI show the same remaining-charge and countdown values.
- A regenerated charge appears lazily without background workers.
- Resume-roll path does not consume.

## Risk Assessment

- Main risk was off-by-one refill/countdown behavior at interval boundaries.
- Mitigation shipped: focused unit coverage for full stock, partial interval, exact refill, multiple refills, reduced max, and zero-charge failures.

## Security Considerations

- Invalid persisted roll values fail closed in strict roll-backed flows.
- Writes stay atomic and minimal through existing settings persistence.

## Next Steps

- Phase complete. Phase 3 wired this into CLI and TUI entrypoints.
