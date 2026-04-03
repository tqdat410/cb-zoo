# Rarity Palette Shipped After Review Forced the Boring Fixes

**Date**: 2026-04-03 10:20
**Severity**: Medium
**Component**: TUI rarity rendering, collection actions, validation flow
**Status**: Resolved

## What Happened

Finished the `260403-0942-rarity-palette-and-collection-actions` work: the requested rarity palette now drives roll/current/collection surfaces, and the old read-only collection screen now supports apply and delete actions. The part that mattered was not the feature demo. Review turned up the ugly edges we still had to fix before this was safe to call done.

## The Brutal Truth

The feature looked finished before it was actually trustworthy. That is the annoying part. We had the shiny UI bits, but tiny terminals could still get ugly, and collection apply had failure paths that would have made the app feel flimsy the first time the state file or collection data pushed back.

## Technical Details

The palette was centralized so `common` is neutral, `uncommon` is green, `rare` is blue, `epic` is magenta, and `legendary` is gold. Review/debug cleanup hit three real issues:

- Tiny-terminal safety: new collection footer/prompt copy could not be allowed to overflow the 64x24 minimum shell, so layout tests were extended to assert roll, edit, and collection screens stay within bounds.
- Collection apply failure UX: apply now keeps the user on `collection`, resets prompt state, and surfaces the real error instead of leaving the screen stale or confusing.
- Backup and validation on collection apply: the controller now re-resolves the selected entry from `collection.json`, creates a backup when missing, then calls `applyUuid()`. Corrupt collection data fails closed with errors like `collection exists but is invalid`, and blocked writes still surface errors like `existing temporary file`.

## What We Tried

- Added `resolveCollectionEntry()` so apply does not trust stale in-memory selection.
- Reused existing backup and UUID apply paths instead of inventing a second unsafe shortcut.
- Added controller and layout regression coverage for apply, delete confirm/cancel, corrupt collection, and narrow-terminal rendering.

## Root Cause Analysis

The original gap was simple: the feature pass focused on visible behavior first. The failure-state contract was weaker than the happy path, and the shell/layout contract was still easy to violate when copy changed.

## Lessons Learned

TUI work is not done when it looks good on a normal terminal. If a new action touches persisted state, backup and validation are not optional polish. Also, a collection action that fails but leaves the user disoriented is just a bug with better marketing.

## Next Steps

Resolved. Follow-up ANSI cleanup also fixed accent persistence inside reveal/current/collection buddy cards: embedded `ANSI.reset` codes were dropping text back to the terminal default after colored segments, so a new persistent-accent helper now reapplies the buddy rarity color after nested resets. Final validation stayed clean: `npm test` 84/84.
