# Phase 4: Implement current, collection, and edit views with shared layout

## Context Links

- [Phase 3](./phase-03-implement-roll-view-reveal-animation-and-action-flows.md)
- [Companion state](../../src/companion-state.js)
- [Collection state](../../src/collection.js)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 2h
- Finish the TUI’s actual utility by pulling the remaining workflows into the same visual system.

## Key Insights

- `--current`, collection, and edit companion already exist as domain behaviors; the work is mostly screen composition and input handling
- Collection wants a two-pane feel more than a giant text dump
- Edit flow should be minimal and modal-like, not a full form framework

## Requirements

### Functional

- Current view shows merged current companion card
- Collection view shows browsable entries or grouped summary with detail pane
- Edit view allows changing name/personality with validation feedback
- Backup/restore actions remain reachable from home or utility menu

### Non-Functional

- Maintain the handheld layout across views
- Avoid oversized text walls in collection mode
- Keep edit interactions keyboard-only and obvious

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Create | `src/tui/views/home-view.js` | Main menu / launcher |
| Create | `src/tui/views/current-view.js` | Current companion screen |
| Create | `src/tui/views/collection-view.js` | Collection browser |
| Create | `src/tui/views/edit-view.js` | Metadata edit modal/view |
| Modify | `src/companion-state.js` | Add helpers if current summary needs reusable structured data |
| Modify | `src/collection.js` | Add helpers for collection browsing if needed |
| Modify | `src/uuid-manager.js` | Reuse update actions; no broad mutation changes |

## Architecture

```text
Home
  -> Roll
  -> Current
  -> Collection
  -> Edit
  -> Backup/Restore

Current/Collection/Edit
  -> shared shell
  -> view-specific content renderer
  -> shared footer hints
```

## Implementation Steps

1. Build home screen
2. Build current companion view
3. Build collection browser with selection cursor
4. Build edit flow for name/personality
5. Add success/error feedback overlays

## Todo List

- [x] Build home menu
- [x] Build current view
- [x] Build collection browser
- [x] Build edit view and validation feedback
- [x] Wire backup/restore entry points into the shell

## Success Criteria

- All major user flows are reachable without leaving the TUI
- The collection screen is more usable than the current text table
- Edit flow stays safe and concise

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Collection screen becomes cluttered | Poor UX | Use grouped list + detail pane, not raw table dump |
| Edit input handling gets messy | Fragile code | Keep two-field form only |
| Too many screens | State explosion | Home + 4 focused views only |

## Security Considerations

- Edit screen must keep current fail-closed validation and never bypass domain checks
- Current view must not leak more Claude state than existing CLI output

## Next Steps

Completed. Home, current, collection, and edit flows now share the handheld shell, and edit mode preserves safe metadata updates while allowing normal text entry.
