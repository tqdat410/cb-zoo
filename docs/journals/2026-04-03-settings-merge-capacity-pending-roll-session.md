# Settings Merge Landed Only After Review Closed the State Gaps

**Date**: 2026-04-03 18:45
**Severity**: Medium
**Component**: settings persistence, collection capacity, pending TUI roll flow
**Status**: Resolved

## What Happened

Completed the settings merge / capacity / pending-roll pass for `cb-zoo`. Backup state moved out of standalone `~/.cb-zoo/backup.json` into unified `~/.cb-zoo/settings.json`, with first-load migration. The same file now owns `maxBuddy` and `pendingBuddy`. TUI collection surfaces show `current/maxBuddy`, Add and Equip refuse to overflow a full collection, and a revealed buddy now survives Back or app restart until a successful Add or Equip clears it.

## The Brutal Truth

The feature looked straightforward. It was not. The risky part was not saving one more JSON file. The risky part was making sure review could not catch us leaving the app in split-brain state: buddy saved but not equipped, equipped but pending not cleared, or full collection silently eating the current reveal. That would have been sloppy state management dressed up as UX.

## Technical Details

Review flushed out three bugs worth fixing before calling this done:

- Invalid persisted `pendingBuddy` data could not be trusted. `settings-manager` now validates shape on load and drops bad payloads to `null` instead of resuming corrupt state.
- Add/Equip rollback was incomplete. If clearing `settings.json` failed or `applyUuid()` hit an existing temp file, the new collection entry could have stuck around incorrectly. The flow now deletes the just-saved entry, restores pending state when needed, and surfaces the real error.
- Capacity handling needed to preserve the rolled buddy. When the collection is full, the app now reports `Collection full (n/max). Delete a buddy first.` and keeps the pending roll intact instead of discarding it.

Validation finished clean: `npm test` passed `111/111`.

## Lessons Learned

Persistence work is never “just storage.” Every state transition needs a failure path, especially when one action touches settings, collection, and Claude UUID state in sequence. Review earned its keep here because the bugs were in rollback semantics, not the happy path.

## Next Steps

Resolved. Keep `settings.json` as the single source of truth and keep writing tests around rollback, migration, and resumable TUI state whenever this flow changes.
