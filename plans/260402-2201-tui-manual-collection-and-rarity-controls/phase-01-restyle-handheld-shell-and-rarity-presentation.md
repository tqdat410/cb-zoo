# Phase 1: Restyle handheld shell and rarity presentation

## Context Links

- [Plan overview](./plan.md)
- [Handheld layout renderer](../../src/tui/render-layout.js)
- [Roll view renderer](../../src/tui/views/roll-view.js)
- [Legacy buddy card styling](../../src/gacha-animation.js)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 1h
- Remove the flat blue screen wash and make rarity presentation feel more intentional and readable.

## Key Insights

- The old `ANSI.bgBlue` fill dominated the whole terminal and conflicted with the handheld-frame look
- Rarity colors existed in both plain reveal and TUI code, so the mapping needed consolidation
- Star/rarity emphasis needed to stay visible in both the reveal phase and final action state

## Requirements

### Functional

- Remove the blue background fill from the handheld shell
- Define one shared rarity accent mapping for the TUI roll experience
- Show rarity stars and color accents clearly in roll reveal states

### Non-Functional

- Preserve current line-width behavior and ANSI-safe padding
- Keep styling changes dependency-free and easy to reason about
- Avoid over-styling the entire app; focus on roll readability and handheld cohesion

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/tui/render-layout.js` | Drop full-screen blue background and keep the shell readable on normal terminal backgrounds |
| Modify | `src/tui/render-helpers.js` | Extend or normalize color helpers if needed for rarity accents |
| Modify | `src/tui/views/roll-view.js` | Render richer rarity banner, stars, and button emphasis |
| Modify | `src/gacha-animation.js` | Reuse or align rarity palette constants if sharing is cleaner than duplication |

## Architecture

```text
rarity theme
  -> shell palette helpers
  -> reveal banner colors
  -> action-row emphasis
```

## Implementation Steps

1. Remove hard-coded shell background fill from the frame renderer
2. Consolidate rarity accent values used by roll reveal and final card actions
3. Refresh roll view text/buttons so rarity stars remain prominent after reveal

## Todo List

- [x] Remove `ANSI.bgBlue` frame background
- [x] Consolidate rarity accent mapping
- [x] Apply rarity styling in roll reveal/final action row

## Success Criteria

- TUI shell renders cleanly on the terminal's normal background
- Rare, epic, and legendary rolls feel visually distinct without breaking layout
- No ANSI width regressions appear in the handheld frame

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Style changes break padding | Misaligned frame | Keep ANSI wrappers localized and reuse existing visible-width helpers |
| Palette changes drift from existing CLI card styling | Inconsistent UX | Reuse or centralize current rarity colors instead of inventing a second set |

## Security Considerations

- Styling-only work must not alter any persistence or UUID mutation paths

## Validation Summary

- `src/tui/render-layout.js` renders the shell without `ANSI.bgBlue`
- `src/tui/render-helpers.js` centralizes rarity color/star/burst accents via `getRarityAccent()`
- `src/tui/views/roll-view.js` uses the shared rarity accents in both rarity and revealed states

## Next Steps

Completed. The shell now renders on the terminal's normal background and the roll UI uses shared rarity accents instead of duplicated styling paths.
