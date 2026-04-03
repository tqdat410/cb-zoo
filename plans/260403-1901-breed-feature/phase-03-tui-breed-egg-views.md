# Phase 3: Breed and Egg TUI Views

## Context Links

- [collection-view.js](../../src/tui/views/collection-view.js)
- [roll-view.js](../../src/tui/views/roll-view.js)
- [home-view.js](../../src/tui/views/home-view.js)
- [render-helpers.js](../../src/tui/render-helpers.js)

## Overview

- **Priority:** P1
- **Status:** completed
- **Brief:** Add pure renderers for parent selection, breed preview, incubating egg, and hatched offspring.

## Key Insights

- Existing TUI views are pure functions returning `{ title, subtitle, bodyLines, footer, status }`. Follow that contract exactly.
- `collection-view.js` already solves list-windowing and detail rendering. Reuse its layout ideas instead of inventing another selection UI pattern.
- `roll-view.js` already solves buddy reveal framing. Hatch rendering should borrow that visual rhythm instead of cloning the full roll action strip.
- Views should render from in-memory state only. Settings reads, timers, and UUID hunts belong in Phase 4.

## Requirements

### Functional Requirements

- Render parent A picker.
- Render parent B picker while excluding parent A.
- Render a breed preview with both parents and predicted egg outcome.
- Render an incubating egg with rarity-specific art and countdown text.
- Render a hatched offspring reveal that shows lineage and next action.

### Non-Functional Requirements

- No side effects in view files.
- Stay consistent with the current centered shell and rarity accents.
- Handle small terminal heights gracefully by degrading list/detail density, not by clipping.

## Architecture

```text
src/tui/views/breed-view.js
  - renderBreedSelectParentView(state, terminal)
  - renderBreedPreviewView(state, terminal)

src/tui/views/egg-view.js
  - renderBreedEggView(state, terminal)
  - renderBreedHatchView(state, terminal)
  - getEggArt(rarity)
```

- One shared parent-selector renderer is enough; do not create separate A/B files unless the implementation needs it.
- Egg art should stay within the repo's `5`-line ASCII bias.

## Related Code Files

### Create

- `src/tui/views/breed-view.js`
- `src/tui/views/egg-view.js`

### Modify

- None required in this phase

### Read Only

- `src/tui/views/collection-view.js`
- `src/tui/views/roll-view.js`
- `src/sprites.js`

### Delete

- None.

## Implementation Steps

1. Build `breed-view.js` around a single selection renderer that accepts:
   - current step label
   - candidate entries
   - active index
   - optional locked parent summary
2. Reuse the collection detail-box language:
   - species
   - rarity
   - eye / hat
   - shiny
   - total
3. Build `renderBreedPreviewView()` with:
   - parent A summary
   - parent B summary
   - predicted offspring traits from `state.breed.previewEgg`
   - a simple confirm/cancel footer
4. Build `egg-view.js` with:
   - a tiny rarity-colored egg art helper
   - countdown text derived from `state.breed.egg.hatchAt`
   - a hatch view that shows the new buddy plus `bredFrom`
5. Keep the home view update small in Phase 4; do not add egg rendering logic to `home-view.js`.

## Todo List

- [x] Create parent selection renderer
- [x] Create preview renderer
- [x] Create incubating egg renderer
- [x] Create hatched buddy renderer
- [x] Reuse existing TUI layout helpers and rarity accents

## Success Criteria

- All new view functions are pure and return valid view objects.
- Parent selection remains readable in short terminals.
- Egg and hatch views match the current shell style.
- No view imports settings-manager or breed-engine directly.

## Risk Assessment

- **View duplication:** mitigate by sharing one selector renderer and borrowing existing detail-box patterns.
- **Terminal clipping:** mitigate by using the same compact-mode logic already seen in collection view.

## Security Considerations

- Treat state as already validated. Views must not trust raw disk data directly.
- Do not leak raw UUIDs in large banners; if shown, keep them abbreviated.

## Next Steps

Phase 4 wires these views into state, controller dispatch, and egg resume behavior.
