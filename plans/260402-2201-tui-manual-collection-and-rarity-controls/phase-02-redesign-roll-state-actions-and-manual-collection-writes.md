# Phase 2: Redesign roll state, actions, and manual collection writes

## Context Links

- [Plan overview](./plan.md)
- [Roll flow](../../src/tui/roll-flow.js)
- [Keypress controller](../../src/tui/controller.js)
- [TUI state](../../src/tui/state.js)
- [Collection persistence](../../src/collection.js)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 2h
- Shift the roll flow from auto-save to explicit post-reveal actions without weakening backup or apply guarantees.

## Key Insights

- `runRollSequence()` used to save immediately after reveal, which polluted collection history on reroll
- The prior hard-coded 3-item action list was too small for the requested UX
- `Equip` required compound behavior: save once, sync collection, then apply UUID

## Requirements

### Functional

- Stop writing collection entries automatically on reveal
- Add roll actions for at least `Equip`, `Add`, `Reroll`, and `Back`
- Make `Equip` save the current buddy to collection and then apply it immediately
- Make `Add` save only once per revealed buddy and keep the user on the roll screen
- Reset action/save state cleanly when rerolling or backing out

### Non-Functional

- Preserve backup-before-first-mutation behavior
- Keep roll action behavior deterministic and easy to test
- Avoid duplicate collection writes from repeated `Add` or `Equip` input on the same reveal

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/tui/roll-flow.js` | Remove auto-save, add explicit action handlers, manage per-roll save state |
| Modify | `src/tui/controller.js` | Support expanded action navigation and selection |
| Modify | `src/tui/state.js` | Add roll action definitions / saved-state fields |
| Modify | `src/tui/views/roll-view.js` | Render expanded buttons and action hints |
| Modify | `src/collection.js` | Only if a small helper improves save-once semantics |

## Architecture

```text
roll reveal
  -> state.roll = { buddy, actions, savedToCollection }
  -> user picks action
      -> Add: save + sync collection + stay on roll screen
      -> Equip: save-if-needed + apply UUID + exit to home
      -> Reroll: discard unsaved roll and start next reveal
      -> Back: discard unsaved roll and return home
```

## Implementation Steps

1. Replace the fixed 3-action array with a shared action definition list
2. Add transient roll state for "already added" so add/equip cannot double-write
3. Move `saveToCollection()` behind explicit `Add`/`Equip` handlers
4. Keep `applyUuid()` behavior unchanged except for the new pre-save step on equip
5. Update status messages so users know whether the roll was added, equipped, rerolled, or discarded

## Todo List

- [x] Remove auto-save from reveal completion
- [x] Add `Equip` and `Add` actions with save-once behavior
- [x] Reset transient roll state correctly on reroll/back/apply
- [x] Update keyboard navigation for the wider action row

## Success Criteria

- Revealing a buddy alone does not create `collection.json`
- `Add` creates one collection entry and stays on the roll screen
- Repeating `Add` on the same roll does not create duplicates
- `Equip` creates one collection entry and applies the UUID
- `Reroll` from an unsaved reveal does not write collection state

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Add/equip logic double-saves | Collection pollution | Track per-roll saved state and funnel both actions through one helper |
| Apply path runs without save | User expectation mismatch | Make equip explicitly call save helper before apply |
| Reroll leaves stale state behind | Wrong buttons/status | Reinitialize roll state from one place before each sequence |

## Security Considerations

- Keep collection validation and temp-file protections untouched
- Keep UUID apply behavior inside the existing validated manager path

## Validation Summary

- `src/tui/roll-flow.js` no longer saves on reveal and funnels `Add`/`Equip` through `ensureRollSaved()`
- `src/tui/roll-config.js` and `src/tui/controller.js` now drive `Equip`, `Add`, `Reroll`, and `Back` with shortcut and arrow-key navigation
- `test/tui-controller.test.js` covers no-auto-save reveal, add save-once semantics, equip save+apply, reroll, back, and equip rollback

## Next Steps

Completed. Roll state now stays transient until explicit user action, `Equip` saves before apply, and reroll/back paths reset state without polluting collection history.
