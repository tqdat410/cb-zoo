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
- UUID management resolves Claude account state with `.claude.json` as the preferred target, keeps legacy fallbacks for mixed installs, edits only `oauthAccount.accountUuid`, pins restore to the originally backed-up state file, rejects malformed UUIDs or tampered backup target paths, fails closed on invalid config or backup payload shapes, and refuses pre-existing temp paths during writes.
- Collection tracking stores minimal buddy metadata under `~/.cb-zoo`, validates existing collection state before roll mode mutates local data, and refuses to overwrite corrupt existing collection data.
- `CB_ZOO_DATA_DIR` is validated so cb-zoo state cannot be redirected into protected Claude state directories such as `.claude` or Windows `%APPDATA%\\Claude`.
- Sprite rendering always returns a 5-line frame so reveal layout and hat placement stay aligned.
- Terminal output supports both animated and plain-text reveal paths.
- Release verification runs through `npm run release:verify`, which chains syntax/package checks, the full test suite, CLI smoke checks, and coverage.
- `npm run release:check` adds `npm pack --dry-run`, and CI mirrors that gate on Ubuntu and Windows without publishing.

## Test Surface

- Deterministic hashing and roll output
- 5-line sprite rendering contract
- UUID backup/apply/restore, including BOM-tolerant config parsing
- Claude account-state resolver ordering across primary and fallback paths
- Invalid backup rejection before config or collection mutation
- Collection persistence and summary formatting
- Corrupt collection rejection without overwriting local data
- CLI help rendering
- CLI smoke coverage for `--help`, `--collection`, `--current`, and plain quick-roll prompt behavior
- Unknown-flag rejection
- Invalid prompt input re-prompting without extra rolls
- `FORCE_COLOR=0` ANSI disable behavior
- Empty non-TTY stdin fail-fast before roll state changes
- Package metadata and release script contract checks
