# Phase 5: Tests and Verification

## Context Links

- [buddy-engine.test.js](../../test/buddy-engine.test.js)
- [settings-manager.test.js](../../test/settings-manager.test.js)
- [tui-controller.test.js](../../test/tui-controller.test.js)
- [integration-flows.test.js](../../test/integration-flows.test.js)

## Overview

- **Priority:** P1
- **Status:** completed
- **Brief:** Add focused coverage for the new domain and TUI paths without making the current large controller suite worse.

## Key Insights

- `test/tui-controller.test.js` is already `399` LOC. Breed-specific state-machine tests should live elsewhere.
- Domain logic is easiest to test through injected seams, not through real waiting or huge random loops.
- `settings-manager.test.js` is the right place for egg schema round-trip and invalid-payload guards.
- `integration-flows.test.js` already covers filesystem-heavy flows, but breed does not need new CLI coverage because the feature is TUI-only.

## Requirements

### Functional Requirements

- Verify breed table completeness and symmetry.
- Verify egg construction math and common-hat normalization.
- Verify UUID hunt success and capped failure paths.
- Verify egg persistence helpers and invalid payload handling.
- Verify breed TUI routing, resume, hatch, and failure recovery.

### Non-Functional Requirements

- No real-time waiting in tests.
- No flaky random assertions.
- Keep controller tests limited to top-level routing smoke.

## Related Code Files

### Modify

- `test/settings-manager.test.js`
- `test/tui-controller.test.js`

### Create

- `test/breed-engine.test.js`
- `test/tui-breed-flow.test.js`

### Read Only

- `test/integration-flows.test.js`

### Delete

- None.

## Implementation Steps

1. Create `test/breed-engine.test.js` for domain coverage:
   - canonical pair-key behavior
   - symmetry / completeness across all unordered species pairs
   - deterministic egg building under stubbed `rng` / `now`
   - common-rarity hat override
   - UUID hunt success with stubbed `uuidFactory`
   - UUID hunt failure with low `maxAttempts`
2. Extend `test/settings-manager.test.js`:
   - defaults now include `breedEgg: null`
   - valid egg round-trip
   - invalid egg payload dropped on read
   - invalid egg mutator rejected without rewriting good data
3. Create `test/tui-breed-flow.test.js`:
   - cannot breed with `< 2` buddies
   - parent B excludes parent A
   - existing incubating egg resumes instead of starting over
   - ready egg hatches and writes `bredFrom`
   - save failure keeps egg recoverable
4. Keep `test/tui-controller.test.js` minimal:
   - home menu can enter breed flow
   - top-level delegate path still renders and returns
5. Run:
   - `npm test`
   - `npm run test:coverage`

## Todo List

- [x] Create `test/breed-engine.test.js`
- [x] Create `test/tui-breed-flow.test.js`
- [x] Update settings tests for `breedEgg`
- [x] Add minimal controller routing smoke coverage
- [x] Run full test suite and coverage

## Success Criteria

- Domain rules are exhaustively checked without flaky randomness.
- Egg persistence is covered by focused unit tests.
- Breed TUI flow is covered without inflating the controller test file further.
- `npm test` and `npm run test:coverage` pass.

## Risk Assessment

- **Huge controller-suite growth:** mitigate by moving breed-heavy assertions into a dedicated flow test file.
- **Slow UUID hunt tests:** mitigate by using stubbed `uuidFactory` sequences rather than brute-force timing.
- **Timer-driven flakiness:** mitigate by testing hatch readiness via injected timestamps, not real sleeps.

## Security Considerations

- Test invalid settings and collection payloads explicitly so malformed local files do not create silent feature corruption.
- Ensure failure tests confirm state recovery, not only thrown errors.

## Next Steps

After implementation, run the full verification commands and then decide whether README/docs need a follow-up sync.
