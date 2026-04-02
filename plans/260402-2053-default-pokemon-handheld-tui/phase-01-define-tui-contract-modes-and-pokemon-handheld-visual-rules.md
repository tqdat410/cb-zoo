# Phase 1: Define TUI contract, modes, and Pokemon handheld visual rules

## Context Links

- [Plan overview](./plan.md)
- [README](../../README.md)
- [System architecture](../../docs/system-architecture.md)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 1.5h
- Freeze the UX contract before coding the terminal runtime.

## Key Insights

- Current code mixes rendering and flow control; TUI work will fail if visual contract stays vague
- “Pokemon handheld” is a layout and pacing problem, not just ANSI colors
- The app needs two modes: interactive TUI default and plain/script-safe fallback

## Requirements

### Functional

- Define default entry behavior for TTY vs non-TTY runs
- Define screen list and primary navigation model
- Define keybindings and action hints
- Define visual language: frame style, palette, labels, spacing, animation pacing

### Non-Functional

- Keep the UI readable in 80x24 terminals
- Keep ASCII output legible without depending on Unicode beyond what the app already uses
- Avoid designs that require pixel-perfect resizing logic

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `README.md` | Document new default interactive mode once settled |
| Future modify | `src/cli.js` | Route TTY runs into TUI |
| Future create | `src/tui/*` | Implement the TUI contract defined here |

## Architecture

```text
entry
  -> if non-TTY or explicit plain mode: existing CLI-safe path
  -> else: launch TUI shell

TUI shell
  -> header/status
  -> content view
  -> footer hints
```

## Implementation Steps

1. Define modes
   - default TTY mode = TUI
   - non-TTY mode = plain/fail-fast CLI-safe path
   - explicit escape hatch flag if needed (`--plain`, `--quick`, etc.)
2. Define screen set
   - Home
   - Roll
   - Current
   - Collection
   - Edit
   - Confirmation overlays
3. Define visual system
   - handheld frame
   - rarity palette
   - typography hierarchy via spacing/borders
   - action bar hints

## Todo List

- [x] Define interactive vs non-interactive mode rules
- [x] Define view list and navigation contract
- [x] Define handheld visual rules and animation pacing

## Success Criteria

- A developer can implement the UI shell without guessing behavior
- The design stays small enough for custom ANSI rendering
- The visual target is distinct from the current ANSI card output

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Theme too vague | Sloppy output | Specify concrete frame/palette/layout rules |
| Trying to support every terminal width | Complex layout logic | Target 80x24 baseline first |
| Mode behavior unclear | Broken pipes/tests | Define TTY vs non-TTY routing up front |

## Security Considerations

- No UI flow should weaken current validation or fail-closed persistence behavior
- Avoid rendering raw config paths or state beyond what current CLI already exposes

## Next Steps

Completed. Interactive TTY runs now route to the handheld shell by default, non-TTY and explicit command paths remain plain, and the handheld visual contract is encoded in the shared layout renderer.
