# Phase 03: TUI Slot Flow and Navigation

## Context Links

- [Overview Plan](./plan.md)
- [Phase 02](./phase-02-shared-breed-config-and-slot-domain.md)
- [src/tui/views/home-view.js](../../src/tui/views/home-view.js)
- [src/tui/views/breed-view.js](../../src/tui/views/breed-view.js)
- [src/tui/views/egg-view.js](../../src/tui/views/egg-view.js)
- [src/tui/state.js](../../src/tui/state.js)

## Overview

- Priority: P1
- Status: Completed
- Goal: expose multiple breed slots cleanly in the TUI without bloating the current handheld shell.

## Key Insights

- Current home menu uses single-egg labels: `Breed Buddy`, `View Egg`, `Hatch Egg`.
- Current breed screen enters parent selection or egg resume immediately because there is only one persisted egg.
- Multi-slot breeding needs an explicit slot-selection screen before any parent-selection or egg-resume path.

## Requirements

- Add a breed-slot picker screen before `select-a`.
- Show each slot as `Empty`, `Incubating`, or `Ready`.
- Selecting an empty slot starts parent selection in that slot.
- Selecting an occupied slot resumes that slot's incubating or ready egg.
- Surface slot counts on HOME in a compact way; do not rely on single-slot menu labels anymore.

## Architecture

- Suggested phase progression:
  - `slot-select`
  - `select-a`
  - `select-b`
  - `confirm`
  - `egg`
  - `hatch`
- HOME should keep one stable breed action label, then surface slot summary in helper copy/status/top summary instead of switching to `View Egg` / `Hatch Egg`.
- Breed slot picker should reuse current collection-style compact list patterns instead of inventing a new heavy layout.
- Confirm, incubating, and hatch screens should show the active slot number for orientation.

## Related Code Files

- Modify:
  - `src/tui/views/home-view.js`
  - `src/tui/home-actions.js`
  - `src/tui/state.js`
  - `src/tui/breed-flow.js`
  - `src/tui/views/breed-view.js`
  - `src/tui/views/egg-view.js`
  - `test/tui-renderers.test.js`
  - `test/tui-layout.test.js`
  - `test/tui-breed-flow.test.js`
- Create:
  - none unless a dedicated slot-view helper is needed to keep files small
- Delete:
  - none

## Implementation Steps

1. Add a slot-picker phase and render surface.
2. Route HOME breed action to slot selection instead of singleton egg-open logic.
3. Show per-slot status summary: empty, incubating countdown, or ready-to-hatch.
4. Preserve current parent-selection and confirm UI after a slot is chosen.
5. Update incubating and hatch copy to show which slot is active.

## Todo List

- [x] Add slot picker phase and renderer
- [x] Remove single-egg home label switching
- [x] Resume the correct slot from picker selection
- [x] Show slot context on confirm/egg/hatch screens
- [x] Add renderer and navigation regressions

## Success Criteria

- Users can open any configured slot from the breed entry point.
- Empty slots start new breeding; occupied slots resume correctly.
- HOME no longer presents misleading single-egg labels.
- Screen content still fits the existing shell width without clipping.

## Risk Assessment

- Main UX risk is overloading HOME or breed with too much slot detail.
- Main implementation risk is screen-state branching complexity from the added `slot-select` phase.

## Security Considerations

- Slot labels and countdowns must be derived from validated settings state only.
- Navigation must not expose or mutate slots outside the effective slot range.

## Next Steps

- Lock the new behavior with tests and sync docs in Phase 04.
