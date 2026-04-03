# Phase 1: Unify rarity palette and buddy card accents

## Context Links

- [Plan overview](./plan.md)
- [Shared TUI render helpers](../../src/tui/render-helpers.js)
- [Buddy card renderer](../../src/gacha-animation.js)
- [Current companion summary](../../src/companion-state.js)
- [Roll view](../../src/tui/views/roll-view.js)
- [Collection view](../../src/tui/views/collection-view.js)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 90m
- Normalize the rarity palette into one source of truth, then push that accent down into the buddy card border and the views that render buddy summaries.

## Key Insights

- Rarity colors are duplicated today in `src/gacha-animation.js` and `src/tui/render-helpers.js`, which already drift from the requested mapping
- Current mapping uses `common` gray and `rare` cyan; user now wants `common` green and `rare` blue
- `showBuddyCard()` already colors the rarity label, but the outer frame stays neutral
- `renderCurrentView()` can bypass the colored card path because stored companions use `formatCompanionSummary()`

## Requirements

### Functional

- Replace the current palette with: `uncommon` neutral/default, `common` green, `rare` blue, `epic` magenta, `legendary` gold
- Make the buddy outer border adopt the same rarity accent in reveal cards and current/collection details
- Keep star labels and burst effects consistent with the shared palette mapping
- Ensure current buddy and collection surfaces expose rarity color even when the user is not on the roll screen

### Non-Functional

- Keep ANSI wrapping isolated so visible-width math still works
- Avoid creating multiple palette constants in different modules
- Keep plain non-ANSI behavior readable when colors are unavailable

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/tui/render-helpers.js` | Promote one shared rarity palette API for color/stars/burst metadata |
| Modify | `src/gacha-animation.js` | Reuse shared rarity colors and color the card frame itself |
| Modify | `src/companion-state.js` | Colorize current buddy summary border and rarity lines using the shared palette |
| Modify | `src/tui/views/roll-view.js` | Keep reveal action row and labels aligned to the new shared palette |
| Modify | `src/tui/views/current-view.js` | Ensure current buddy surface uses the colored summary path |
| Modify | `src/tui/views/collection-view.js` | Surface colored rarity detail lines or a full colored buddy card |

## Architecture

```text
shared rarity palette
  -> getRarityAccent(rarity)
      -> color
      -> stars
      -> burst
  -> buddy card renderers
      -> label accent
      -> border accent
  -> screen views
      -> roll palette
      -> current summary
      -> collection detail
```

## Implementation Steps

1. Move rarity color ownership behind one helper that both the TUI and gacha card renderer consume
2. Refactor buddy card border rendering so frame glyphs can be colored without corrupting padding
3. Update current companion summary to consume the same accent instead of a neutral frame
4. Revisit collection detail rendering so it shows the same rarity accent vocabulary as roll/current

## Todo List

- [x] Replace duplicated rarity color tables with one shared mapping
- [x] Color the buddy outer frame based on rarity
- [x] Surface rarity accents in current buddy rendering
- [x] Surface rarity accents in collection rendering

## Success Criteria

- Color mapping matches the requested rarity palette exactly
- Buddy cards show colored borders in reveal and inspection contexts
- Current and collection screens visibly communicate rarity without relying on the roll view

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| ANSI codes inflate line length | Crooked frames | Keep visible-length helpers in front of all padded output |
| Border recolor leaks into content | Hard-to-read cards | Wrap only frame glyphs or full lines deliberately, then test rendered widths |
| Current summary diverges from reveal card | Inconsistent UI | Reuse helper(s) instead of maintaining a second custom palette path |

## Security Considerations

- Color refactors must not alter buddy generation, UUID mutation, or persisted collection entry shape
- No new external dependency or terminal capability detection layer should be introduced

## Next Steps

Completed. Shared rarity accent helpers now drive roll cards, current buddy rendering, and collection detail surfaces.
