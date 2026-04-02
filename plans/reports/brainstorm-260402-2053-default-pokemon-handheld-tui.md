# Brainstorm Summary: Default Pokemon Handheld TUI

## Problem

Current `cb-zoo` UI is ANSI-heavy CLI, not a real TUI. User wants a default terminal UI that feels nicer, specifically with stronger ASCII presentation and a Pokemon handheld vibe, while staying light enough for simple gacha animation.

## Constraints

- Keep runtime light; avoid dragging the app into framework-heavy terminal UI architecture
- Preserve current core logic: roll engine, Claude state mutation, collection persistence, current-companion summary
- Keep non-interactive/scripted flows viable for tests and pipes
- Avoid expanding animation scope into complex real-time rendering

## Approaches Considered

### 1. Polish current CLI only

Pros:
- Lowest risk
- No architecture rewrite
- Keeps zero-dependency clean

Cons:
- Not a real TUI
- Still fragmented by flags/prompts
- Hard to achieve “Pokemon handheld” feel with current one-shot output model

### 2. Full TUI via Blessed-like framework

Pros:
- Faster path to panes, focus, widgets, scrolling
- Easier navigation and screen composition

Cons:
- Breaks zero-dependency goal
- Overkill for this app size
- Adds framework constraints and more moving parts than needed

### 3. Custom micro-TUI on raw ANSI

Pros:
- Best fit for app size
- Keeps dependency footprint minimal
- Full control over handheld framing, ASCII art direction, and simple gacha animation
- Lets business logic stay untouched under a new presentation layer

Cons:
- Must own terminal lifecycle, input mode, redraw discipline, and resize handling
- Test strategy becomes more deliberate

## Recommended Solution

Build a custom micro-TUI and make it the default interactive mode.

### UX Direction

- Theme: Pokemon handheld
- Full-screen framed shell with:
  - top status/header
  - central stage for buddy card / collection / current companion
  - bottom action strip for key hints
- Views:
  - Home
  - Roll / Reveal
  - Current Companion
  - Collection
  - Edit Companion
  - Backup / Restore confirmations
- Key-driven navigation:
  - arrows or `j/k`
  - `enter`
  - `esc`
  - `q`
- Animation stays simple:
  - species shuffle / silhouette stage
  - rarity flash
  - reveal settle

### Technical Direction

- Keep existing domain modules intact:
  - `buddy-engine.js`
  - `uuid-manager.js`
  - `collection.js`
  - `companion-state.js`
- Add TUI-specific layer:
  - screen rendering
  - keypress handling
  - view state
  - layout helpers
  - animation timeline
- Preserve non-interactive safety:
  - non-TTY sessions should still use plain CLI/fail-fast behavior
  - tests should not depend on full-screen terminal state

## Risks

- Terminal cleanup bugs can leave cursor hidden or screen dirty
- Resize behavior can get ugly if layout assumptions are rigid
- Over-designing the TUI will waste time; this should stay “light but deliberate”
- Animation and input logic can become tangled if view/state boundaries are not explicit

## Success Criteria

- TUI becomes default interactive experience
- UI feels visually cohesive and handheld-like, not just colorful
- Roll flow, current companion, collection, and edit flows all work inside one navigation shell
- Non-interactive and test flows remain reliable
- No dependency explosion

## Next Step

Create a detailed implementation plan focused on a micro-TUI runtime, phased rollout, and regression strategy.
