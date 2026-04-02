# cb-zoo Safety Hardening

**Date**: 2026-04-01 18:10
**Severity**: High
**Component**: CLI fail-closed behavior, UUID writes, local state validation
**Status**: Resolved

## What Happened

The first green run was not actually safe enough. Follow-up review exposed multiple state-corruption paths around `backup.json`, `collection.json`, BOM-prefixed config reads, malformed UUID payloads, and invalid config container shapes. The obvious happy path worked. The dangerous part was everything around it.

## The Brutal Truth

This was the exact kind of bug cluster that makes a CLI look polished while still being reckless with user state. A tool that edits `~/.claude/.config.json` does not get to be “mostly safe”. Silent fallback, late validation, or false-success writes are unacceptable here.

## Technical Details

- BOM-prefixed `.config.json` failed JSON parse on Windows.
- Corrupt `collection.json` originally failed too late: roll mode could create `backup.json` and print a buddy before the collection parse error surfaced.
- Collection validation originally trusted any JSON array, including junk like `[42]`.
- `applyUuid()` originally accepted malformed UUID strings and invalid `oauthAccount` container shapes such as `[]`.
- Existing tests were green before these cases were exercised as real subprocess flows.

## What We Tried

- Stripped optional UTF-8 BOM bytes before JSON parse.
- Added strict UUID validation for current config, backup restore, and apply paths.
- Hardened config-shape checks so non-object roots and array-shaped `oauthAccount` values are rejected.
- Moved collection validation to the front of roll mode so bad persisted state fails before backup, reveal, or write side effects.
- Validated collection entry shape, not just “array or not”.
- Added regression tests for every failure mode above.

## Root Cause Analysis

The core mistake was trusting superficial green tests. The real bugs lived in stateful boundaries: persisted files, CLI sequencing, and “already exists” shortcuts that assumed the on-disk data was trustworthy.

## Lessons Learned

- Any file under `~/.claude` or `~/.cb-zoo` must be treated as hostile input.
- Fail-closed has to happen before side effects, not after.
- Subprocess tests catch CLI bugs that direct module tests miss.

## Next Steps

- Add more ANSI/TTY coverage for `gacha-animation.js`.
- Run a final manual terminal spot-check before publish.
