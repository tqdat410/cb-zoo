# Phase 2: Rename archive flows and add collection actions

## Context Links

- [Plan overview](./plan.md)
- [Home view](../../src/tui/views/home-view.js)
- [Collection view](../../src/tui/views/collection-view.js)
- [TUI state](../../src/tui/state.js)
- [Keypress controller](../../src/tui/controller.js)
- [Roll flow](../../src/tui/roll-flow.js)
- [Collection persistence](../../src/collection.js)
- [UUID manager](../../src/uuid-manager.js)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 2h
- Replace remaining archive wording with collection wording, then turn the collection screen from read-only browser into a place where the user can apply or delete the selected buddy.

## Key Insights

- The home menu already routes through `collection`, but visible copy still says `Archive`
- The collection screen currently supports only up/down navigation and escape
- `src/collection.js` already exposes `deleteCollectionEntry()`, so delete support mainly needs a TUI flow and safe state refresh
- Applying a buddy from collection should reuse `applyUuid()` and current-state sync, not the roll flow save/apply helper

## Requirements

### Functional

- Rename user-facing `Archive` labels, subtitles, and statuses to `Collection`
- Add collection actions for applying the selected buddy and deleting the selected buddy
- Require an explicit confirmation step before delete mutates `collection.json`
- Refresh selection/index and status after apply or delete
- Keep empty-state behavior coherent after the last item is removed

### Non-Functional

- Keep keyboard-first navigation simple and discoverable within the bounded shell
- Avoid creating a brand-new screen for delete confirm; keep it inside collection state
- Preserve current collection file format and validation logic

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/tui/views/home-view.js` | Rename menu label and home hero copy from archive to collection |
| Modify | `src/tui/views/collection-view.js` | Rename headings and render collection action hints plus confirm prompt |
| Modify | `src/tui/state.js` | Add collection action/confirmation sub-state |
| Modify | `src/tui/controller.js` | Handle apply, delete, and confirm/cancel key flows |
| Modify | `src/collection.js` | Add small helper(s) only if needed for stable index/remove behavior |
| Modify | `src/uuid-manager.js` | Reuse only if a tiny helper is needed for clearer apply result messaging |

## Architecture

```text
screen = collection
  -> browsing mode
      -> up/down changes selected entry
      -> enter/a applies selected buddy UUID
      -> d opens delete confirm
  -> confirm-delete mode
      -> enter/y deletes selected entry
      -> escape/n cancels
  -> after mutation
      -> reload collection entries
      -> clamp selection index
      -> update status message
```

## Implementation Steps

1. Rewrite visible `Archive` copy to `Collection` in menu, titles, subtitles, and statuses
2. Extend TUI state with a small collection prompt state such as `idle | confirm-delete`
3. Add keyboard handlers for `apply`, `delete`, confirm, and cancel
4. Refresh collection data and selection index after delete, and sync current state after apply
5. Tighten collection footer/prompt text so it still fits narrow shells

## Todo List

- [x] Remove remaining archive wording from the TUI surface
- [x] Add apply action inside collection
- [x] Add delete action with explicit confirmation
- [x] Refresh collection state safely after mutation

## Success Criteria

- User-facing collection surfaces no longer say `Archive`
- The selected collection buddy can be applied without leaving the collection screen broken or stale
- Delete requires explicit confirmation and cannot happen from a stray navigation key
- Removing the final item produces a clean empty collection state

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Overloaded controls confuse users | UX friction | Keep footer hints short and mode-specific |
| Delete confirm state leaks after mutation | Broken keys | Reset prompt state on every exit path |
| Apply path duplicates saved entries | Collection pollution | Call `applyUuid()` directly from selected entry instead of roll save helpers |

## Security Considerations

- Delete and apply must keep all existing validation and temp-file protections in place
- Confirm flow must never bypass collection parsing or state-file validation

## Next Steps

Completed. The TUI now uses `Collection` copy, supports in-place apply/delete actions, and resets prompt plus selection state safely after mutation paths.
