# Phase 3: CLI And TUI Roll Gating

## Context Links

- [Overview plan](./plan.md)
- [Phase 2](./phase-02-shared-roll-charge-domain-service.md)
- [README](../../README.md)

## Overview

- Priority: High
- Status: Completed
- Goal: enforce roll charges across plain/quick CLI and TUI without charging for pending-roll resume or unrelated screens.

## Key Insights

- CLI needed rollback semantics because charge spend happens before the reveal/prompt loop.
- TUI needed an atomic settings write so a failed pending reveal save would not spend a charge.
- Home and reveal screens both needed visible charge state so empty-charge behavior is not surprising.

## Requirements

- Every brand-new roll consumes `1` charge.
- CLI/TUI reroll also consumes `1` charge.
- Resume pending roll consumes `0`.
- Zero-charge new rolls fail with a countdown message.
- Home shows current charge count plus next-refill timing.
- Reveal screen disables `Reroll` when no charge is available.

## Architecture

- `src/cli.js` now checks `getRollChargeSnapshot()` before backup/reveal side effects, spends via `consumeRollCharge()`, and refunds via `setRollCharges()` if a pre-prompt failure happens.
- `src/tui/roll-flow.js` checks charge availability before spinning, rechecks after the animation, then saves decremented `rollCharges` plus `pendingBuddy` together.
- `src/tui/views/home-view.js` renders current inventory and `FULL` vs `Next +1`.
- `src/tui/views/roll-view.js` marks `Reroll` as empty when no charge remains and removes reroll hotkeys from the footer in that state.

## Related Code Files

- Modify:
  - `src/cli.js`
  - `src/tui/roll-flow.js`
  - `src/tui/views/home-view.js`
  - `src/tui/views/roll-view.js`
- Create:
  - None.
- Delete:
  - None.

## Shipped Implementation

1. Added CLI zero-charge preflight and shared charge spend.
2. Added CLI refund logic when a later failure happens before the reroll/apply prompt.
3. Added TUI zero-charge blocking for fresh rolls from home.
4. Kept pending-roll resume outside the charge gate.
5. Added home-screen charge summary and next-refill countdown.
6. Disabled reveal-screen reroll affordances when the shared pool is empty.

## Todo List

- [x] Gate CLI quick/plain roll by charges
- [x] Gate TUI new roll by charges
- [x] Exempt resume-roll path
- [x] Add home charge summary and countdown
- [x] Add no-charge user-facing messages

## Success Criteria

- A fresh roll always costs one charge.
- Zero-charge state blocks only brand-new roll generation.
- Home and reveal screens reflect live charge state accurately.
- Existing non-roll features stay untouched.

## Risk Assessment

- Main risk was charging before later failure points.
- Mitigation shipped:
  - CLI refunds the spent charge on pre-prompt failure.
  - TUI charge spend happens in the same settings write as `pendingBuddy`, so failed persistence cannot burn inventory.

## Security Considerations

- Charge state is not mutated on read-only screens.
- User-facing errors stay descriptive without exposing file contents.

## Next Steps

- Phase complete. Phase 4 locked the behavior with tests and docs.
