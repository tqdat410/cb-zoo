# Phase 2: Build terminal runtime primitives and navigation shell

## Context Links

- [Phase 1](./phase-01-define-tui-contract-modes-and-pokemon-handheld-visual-rules.md)
- [Plan overview](./plan.md)
- [Code standards](../../docs/code-standards.md)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 2.5h
- Build the minimal infrastructure that makes the TUI real without entangling domain logic.

## Key Insights

- The current `gacha-animation.js` already has cursor and ANSI helpers, but they are too reveal-specific to become the app shell as-is
- Runtime concerns should be isolated: screen clear, cursor hide/show, keypress parsing, resize, teardown
- The shell should render views from pure state snapshots where possible

## Requirements

### Functional

- Add terminal lifecycle management
- Add keypress reader for arrows, enter, escape, letters
- Add shared layout renderer: frame, title, content, footer
- Add screen router / state machine for moving between views

### Non-Functional

- Always restore cursor and input mode on exit/error
- Avoid flicker where possible by redrawing whole screens predictably
- Keep modules small and focused

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Create | `src/tui/app.js` | Main runtime loop and teardown |
| Create | `src/tui/controller.js` | Input dispatch and cross-view action handling |
| Create | `src/tui/read-keypress.js` | Raw keypress decoding |
| Create | `src/tui/render-layout.js` | Shared handheld frame renderer |
| Create | `src/tui/state.js` | Screen state, view routing, and synced data helpers |
| Modify | `src/gacha-animation.js` | Reuse or relocate ANSI helpers as needed |
| Create | `src/launch-mode.js` | Decide whether interactive entry should launch TUI |
| Modify | `src/cli.js` | Launch TUI in interactive mode |

## Architecture

```text
cli.js
  -> launchTuiApp()

tui/app.js
  -> init terminal
  -> state machine
  -> render current view into layout
  -> listen for keypress
  -> dispatch action
  -> rerender
  -> cleanup on exit/error
```

## Implementation Steps

1. Extract or duplicate safe ANSI lifecycle helpers
2. Build raw keypress handler
3. Build layout shell renderer
4. Build top-level state object
5. Wire `cli.js` so TTY default enters the shell
6. Keep current plain code path reachable for tests/non-TTY use

## Todo List

- [x] Add terminal lifecycle primitives
- [x] Add keypress decoding and action dispatch
- [x] Add shared handheld layout shell
- [x] Route interactive CLI entry into the new shell

## Success Criteria

- Launching the app in a terminal shows a stable handheld shell
- Cursor/input state is restored even on thrown errors
- View switching works before feature-specific screens are built

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Raw mode bugs | Broken terminal session | Centralize cleanup in one runtime module |
| Render/input coupling | Hard-to-fix bugs | Use a simple state machine boundary |
| Overbuilding | Wasted time | Keep shell primitive; no widget framework |

## Security Considerations

- Runtime shell must not swallow domain errors or keep going after failed writes
- Exit paths should surface errors clearly after restoring terminal state

## Next Steps

Completed. The terminal runtime now uses alternate screen mode, raw keypress handling, a shared handheld frame, and explicit TTY launch routing through `src/launch-mode.js`.
