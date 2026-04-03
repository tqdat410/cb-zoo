# Phase 4: TUI Wiring and Controller Modularization

## Context Links

- [controller.js](../../src/tui/controller.js)
- [state.js](../../src/tui/state.js)
- [home-view.js](../../src/tui/views/home-view.js)
- [roll-flow.js](../../src/tui/roll-flow.js)
- [Phase 2](./phase-02-egg-persistence.md)
- [Phase 3](./phase-03-tui-breed-egg-views.md)

## Overview

- **Priority:** P1
- **Status:** completed
- **Brief:** Wire the new feature into the existing TUI while keeping `controller.js` small enough to maintain.

## Key Insights

- `src/tui/controller.js` is already over the repo's practical file-size target. Adding a full breed state machine there would be the wrong direction.
- `state.js` is still small and can safely own a compact `breed` sub-state plus render dispatch.
- `roll-flow.js` is the best reference for "busy" behavior and collection/apply rollback patterns, but breed save/hatch should be its own flow.
- Timer handles are runtime details, not app state. Persist `hatchAt`; keep any interval handle outside serializable state.

## Requirements

### Functional Requirements

- Add `Breed` to the home menu.
- Resume an incubating egg if one already exists.
- If the egg is ready, route into hatch instead of starting a new breed.
- Handle the full flow:
  - select parent A
  - select parent B
  - preview
  - create egg
  - incubate / resume
  - hatch
  - save offspring to collection
- Block breeding when:
  - collection has fewer than 2 entries
  - collection is already full
  - the user tries to reuse the same entry as both parents

### Non-Functional Requirements

- Keep `controller.js` mostly as a dispatch file.
- Keep timer cleanup explicit on every exit path.
- Preserve current keyboard conventions: arrows + `hjkl`, `Enter`, `Esc`, `q`.

## Architecture

```text
src/tui/breed-flow.js
  - openBreedFlow(state)
  - handleBreedKeypress(state, key, writeScreen)
  - maybe start/stop egg ticker in module-local runtime state

src/tui/state.js
  - add breed sub-state
  - add render dispatch for breed/egg/hatch screens

src/tui/controller.js
  - delegate home "breed" action
  - delegate breed-screen keypress handling
```

Suggested `state.breed` shape:

```js
{
  phase: "idle" | "select-a" | "select-b" | "preview" | "egg" | "hatched",
  selectionIndex: 0,
  parentA: null,
  parentB: null,
  previewEgg: null,
  egg: null,
  hatchedBuddy: null
}
```

- Do **not** store interval IDs inside `state`.

## Related Code Files

### Modify

- `src/tui/views/home-view.js`
- `src/tui/state.js`
- `src/tui/controller.js`

### Create

- `src/tui/breed-flow.js`

### Read Only

- `src/tui/roll-flow.js`
- `src/settings-manager.js`
- `src/collection.js`

### Delete

- None.

## Implementation Steps

1. Update `home-view.js`:
   - insert `Breed` after `Collection`
   - if an egg exists, relabel to a resume/hatch variant instead of creating a second menu item
2. Extend `createInitialState()` with a compact `breed` object.
3. Extend `renderScreen()` so one `"breed"` screen delegates by `state.breed.phase` to the new view files.
4. Create `src/tui/breed-flow.js` to own:
   - candidate filtering for parent B
   - preview egg creation
   - egg resume from settings
   - hatch execution
   - collection save for offspring
5. Keep `controller.js` thin:
   - home menu dispatch calls `openBreedFlow()`
   - breed screen keys call `handleBreedKeypress()`
6. Keep the egg countdown runtime local:
   - derive remaining time from `hatchAt`
   - only use a lightweight ticker to trigger re-render while on the egg screen
   - clear that ticker on `Esc`, hatch completion, thrown error, or screen change
7. On successful hatch save:
   - write offspring with `bredFrom`
   - clear `breedEgg`
   - refresh collection state
8. If collection becomes full between incubation and hatch save:
   - do not delete the egg
   - keep the user on a recoverable hatch/resume path

## Todo List

- [x] Add Breed to the home menu
- [x] Add `breed` sub-state and render dispatch
- [x] Create `src/tui/breed-flow.js`
- [x] Delegate breed handling out of `controller.js`
- [x] Handle incubating/ready egg resume
- [x] Clear timer handles on every exit path
- [x] Preserve recoverability when save-to-collection fails

## Success Criteria

- Breed appears as a first-class TUI flow without bloating the controller.
- Incubating eggs survive restart.
- Ready eggs route to hatch instead of forcing a new parent selection.
- Failed hatch saves keep the egg recoverable.
- Existing roll, current, collection, and edit flows remain unchanged.

## Risk Assessment

- **Controller sprawl:** mitigate by moving all breed-specific transitions into `src/tui/breed-flow.js`.
- **Ticker leaks:** mitigate with one module-local timer and explicit cleanup helpers.
- **Blocking hatch hunt:** acceptable for this CLI/TUI, but keep it outside render code and surface a clear status message.

## Security Considerations

- Re-validate collection/settings state when entering the breed flow; do not trust stale in-memory selections after file errors.
- Do not overwrite an existing incubating egg silently.
- Keep all error handling fail-closed and return to a recoverable screen.

## Next Steps

Phase 5 locks the feature down with focused domain, settings, and TUI tests.
