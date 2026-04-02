# cb-zoo Initial Implementation

**Date**: 2026-04-01 16:30
**Severity**: Medium
**Component**: CLI orchestration, UUID safety, terminal flow
**Status**: Resolved

## What Happened

Built `cb-zoo` from a plan-only workspace into a working zero-dependency Node CLI: deterministic buddy engine, UUID backup/apply/restore, ASCII sprites, collection tracking, docs, and tests. The first pass looked done fast. Then delegated review found the real problems: unsafe unknown-flag handling, invalid prompt input burning extra rolls, broken `FORCE_COLOR=0` semantics, corrupt backup bypassing the safety guarantee, and closed stdin letting the process exit cleanly after mutating local state.

## The Brutal Truth

The frustrating part is that the obvious code was not the dangerous code. The risky bugs were all in the “glue” paths: arg parsing, prompt behavior, empty stdin, and backup validation. If I had stopped after the first green test run, this tool would have looked polished while still carrying stateful CLI footguns. That would have been sloppy.

## Technical Details

- Unknown flags originally passed through `parseArgs(..., { strict: false })` and could trigger a real roll.
- Invalid answers at the apply/reroll/quit prompt silently rerolled and wrote extra collection entries.
- `FORCE_COLOR=0` was truthy, so ANSI mode stayed enabled.
- Corrupt `~/.cb-zoo/backup.json` could bypass the backup guard.
- Closed non-TTY stdin printed a prompt and exited `0` after backup/collection writes.

## What We Tried

- Added strict arg parsing.
- Reworked prompt handling to re-prompt on invalid input instead of rerolling.
- Added explicit `NO_COLOR` / `FORCE_COLOR=0` handling.
- Validated backup contents, not just backup-file existence.
- Buffered non-TTY stdin up front so empty input fails before any mutation.
- Added subprocess regression tests for every one of those cases.

## Root Cause Analysis

The main mistake was trusting unit-level confidence too early. The bad behavior only showed up when the CLI was exercised as a real process with real stdin, real env vars, and real temp files.

## Lessons Learned

- Stateful CLIs need subprocess tests, not just direct module tests.
- “Exists” is not the same thing as “valid” for backup and config files.
- Terminal behavior needs explicit handling for EOF, ANSI env vars, and non-TTY input.

## Next Steps

- Add more automated coverage for animation branches.
- Verify the animated path in a live TTY manually on Windows Terminal.
- Move the workspace into git before any release work.
