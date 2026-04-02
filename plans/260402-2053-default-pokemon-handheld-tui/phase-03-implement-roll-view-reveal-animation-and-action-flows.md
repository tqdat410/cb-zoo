# Phase 3: Implement roll view, reveal animation, and action flows

## Context Links

- [Phase 2](./phase-02-build-terminal-runtime-primitives-and-navigation-shell.md)
- [Current animation module](../../src/gacha-animation.js)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 2h
- Make the gacha flow feel handheld-themed without turning it into a heavyweight animation engine.

## Key Insights

- The current reveal is already staged; it just needs to be recontextualized into a persistent screen
- The TUI should not clear into totally unrelated layouts during animation; it should animate inside the shell
- Roll/apply/reroll/back actions are the emotional center of the app

## Requirements

### Functional

- Add roll screen and staged reveal sequence
- Keep `Apply`, `Reroll`, and `Back` actions visible after reveal
- Save collection entries at the correct point in the flow
- Keep backup safeguards unchanged

### Non-Functional

- Animation should finish quickly
- Keep frame rate simple; a few deterministic redraws are enough
- Avoid long waits that make the app feel sluggish

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Create | `src/tui/views/roll-view.js` | Roll screen and reveal-state rendering |
| Create | `src/tui/roll-flow.js` | Timed reveal orchestration and post-roll actions |
| Modify | `src/gacha-animation.js` | Reuse reveal concepts or retire old full-screen flow |
| Modify | `src/cli.js` | Remove legacy prompt-driven loop from default TTY path |
| Modify | `src/collection.js` | Only if helper boundaries need cleanup |
| Modify | `src/uuid-manager.js` | No behavior change expected; only if action integration needs small helpers |

## Architecture

```text
Roll action
  -> validate collection + backup preconditions
  -> generate buddy
  -> run staged reveal inside TUI shell
  -> save collection
  -> expose action bar
  -> apply / reroll / back
```

## Implementation Steps

1. Add roll-screen state model
2. Convert reveal phases into shell-contained redraws
3. Attach action bar and keybindings
4. Preserve backup-before-first-mutation rules
5. Ensure apply exits or returns to shell cleanly with feedback

## Todo List

- [x] Build roll screen renderer
- [x] Build reveal timeline inside shell
- [x] Hook apply/reroll/back actions
- [x] Preserve backup and collection behavior

## Success Criteria

- Roll flow feels like the centerpiece of the TUI
- Reroll/apply decisions no longer rely on line prompts
- Existing safety constraints still hold

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Animation rewrites become too invasive | Delivery slows | Reuse current reveal stages, only change presentation |
| Save/apply timing shifts incorrectly | Data bugs | Keep persistence order explicit and tested |
| TUI blocks on sleeps awkwardly | Feels laggy | Use short, fixed animation phases only |

## Security Considerations

- Applying a UUID must still use the existing validated write path
- Animation must never mask write failures or invalid collection state errors

## Next Steps

Completed. The roll stage now reveals inside the shell, saves buddies into the collection, preserves backup-before-mutation behavior, and supports apply/reroll/back actions without line prompts.
