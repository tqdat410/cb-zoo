# Codebase Summary

## Scope

This repository currently contains a single CLI package named `cb-zoo`.

## Entry Points

- `src/cli.js`: main executable for user interaction
- `package.json`: package metadata, `bin` mapping, release-verification scripts, and the `prepublishOnly` publish guard
- `scripts/check-release-contract.cjs`: syntax and package-contract verification for publish readiness
- `scripts/smoke-cli.cjs`: deterministic CLI smoke coverage for the shipped command surface
- `.github/workflows/ci.yml`: push, pull-request, and manual CI gates for tests plus release-check verification without publish

## Key Behaviors

- Buddy generation is deterministic from UUID plus the hardcoded salt.
- UUID and collection JSON readers strip an optional UTF-8 BOM before parsing.
- Local cb-zoo settings now live in `~/.cb-zoo/settings.json`; first load migrates legacy `backup.json` into the unified settings file.
- Settings management normalizes `maxBuddy` to a positive integer with a default of `50`, stores backup metadata, and drops invalid `pendingBuddy` payloads instead of resuming them.
- UUID management resolves Claude account state with `.claude.json` as the preferred target, keeps legacy fallbacks for mixed installs, edits only `oauthAccount.accountUuid`, pins restore to the originally backed-up state file stored in `settings.json`, rejects malformed UUIDs or tampered backup target paths, fails closed on invalid config or backup payload shapes, and refuses pre-existing temp paths during writes.
- Collection tracking stores minimal buddy metadata under `~/.cb-zoo`, validates existing collection state before roll mode mutates local data, refuses to overwrite corrupt existing collection data, and enforces `maxBuddy` capacity before saving.
- The default TUI persists each revealed-but-unsaved roll as `pendingBuddy`, keeps it on Back, resumes it from the home "Resume Roll" action after restart, and clears it only after successful Add or Equip.
- Collection output surfaces expose current capacity as `current/maxBuddy` in both the TUI collection subtitle/status and the plain CLI summary.
- `CB_ZOO_DATA_DIR` is validated so cb-zoo state cannot be redirected into protected Claude state directories such as `.claude` or Windows `%APPDATA%\\Claude`.
- Sprite rendering always returns a 5-line frame so reveal layout and hat placement stay aligned.
- Terminal output supports both animated and plain-text reveal paths.
- Release verification runs through `npm run release:verify`, which chains syntax/package checks, the full test suite, CLI smoke checks, and coverage.
- `npm run release:check` adds `npm pack --dry-run`, and CI mirrors that gate on Ubuntu and Windows without publishing.

## Test Surface

- Deterministic hashing and roll output
- 5-line sprite rendering contract
- Settings load/save plus legacy `backup.json` migration
- UUID backup/apply/restore, including BOM-tolerant config parsing and pinned restore metadata in `settings.json`
- Claude account-state resolver ordering across primary and fallback paths
- Invalid backup rejection before config or collection mutation
- Collection persistence, capacity enforcement, and summary formatting
- Corrupt collection rejection without overwriting local data
- Pending buddy persistence, rollback, and resume behavior in the TUI
- CLI help rendering
- CLI smoke coverage for `--help`, `--collection`, `--current`, and plain quick-roll prompt behavior
- Unknown-flag rejection
- Invalid prompt input re-prompting without extra rolls
- `FORCE_COLOR=0` ANSI disable behavior
- Empty non-TTY stdin fail-fast before roll state changes
- Package metadata and release script contract checks
