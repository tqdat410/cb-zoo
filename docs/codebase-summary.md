# Codebase Summary

## Scope

This repository currently contains a single CLI package named `cb-zoo`.

## Entry Points

- `src/cli.js`: main executable for user interaction
- `src/roll-charge-manager.js`: shared roll-charge countdown and consume logic for CLI and TUI
- `src/breed-table.js`: static parent-species lookup used by the TUI breed flow
- `src/breed-engine.js`: offspring trait generation plus UUID hunting for ready eggs
- `src/tui/breed-flow.js`: TUI breed, incubate, and hatch state machine
- `package.json`: package metadata, `bin` mapping, release-verification scripts, and the `prepublishOnly` publish guard
- `scripts/check-release-contract.cjs`: syntax and package-contract verification for publish readiness
- `scripts/smoke-cli.cjs`: deterministic CLI smoke coverage for the shipped command surface
- `.github/workflows/ci.yml`: push, pull-request, and manual CI gates for tests plus release-check verification without publish

## Key Behaviors

- Buddy generation is deterministic from UUID plus the hardcoded salt.
- UUID and collection JSON readers strip an optional UTF-8 BOM before parsing.
- Local cb-zoo settings now live in `~/.cb-zoo/settings.json`; first load migrates legacy `backup.json` into the unified settings file.
- Settings management normalizes `maxBuddy` to a positive integer with a default of `50`, stores backup metadata, persists `rollConfig` and `rollCharges`, persists both `pendingBuddy` and `breedEgg` including optional `hatchedUuid`, and drops invalid pending-roll or egg payloads instead of resuming them.
- Launch routing is split by terminal mode: interactive no-flag TTY runs open the TUI, while `--plain`, direct command flags, help, and non-interactive runs stay on the plain CLI code paths.
- Roll charges now default to `100` max uses with one lazy refill every `300000` ms, live in `settings.json`, and are shared across plain CLI rolls, TUI fresh rolls, and rerolls.
- Plain CLI refunds a spent charge if local persistence fails before the reveal prompt, while the TUI only decrements charges when it can atomically persist the new `pendingBuddy` in `settings.json`.
- UUID management resolves Claude account state with `.claude.json` as the preferred target, keeps legacy fallbacks for mixed installs, edits only `oauthAccount.accountUuid`, pins restore to the originally backed-up state file stored in `settings.json`, rejects malformed UUIDs or tampered backup target paths, fails closed on invalid config or backup payload shapes, and refuses pre-existing temp paths during writes.
- Collection tracking stores minimal buddy metadata under `~/.cb-zoo`, validates existing collection state before roll mode mutates local data, refuses to overwrite corrupt existing collection data, preserves optional `bredFrom` lineage metadata, and enforces `maxBuddy` capacity before saving.
- The default TUI persists each revealed-but-unsaved roll as `pendingBuddy`, keeps it on Back, resumes it from the home "Resume Roll" action after restart, and clears it only after successful Add or Equip.
- The shared shell header redraws once per second for live countdowns, and all TUI screens now use the same compact `collection/max | rerolls/max | timer` strip, with HOME also centering each menu row independently.
- The reveal screen still disables the reroll action when the shared charge pool is empty.
- The default TUI also exposes a breed loop: `Breed Buddy` starts parent selection, `View Egg` resumes incubation, and `Hatch Egg` resumes a ready egg from settings.
- Breed start now only requires at least two saved buddies, so pending rolls and full collection capacity do not block incubation.
- Breed parent selection now uses a collection-style list/detail picker, keeps the chosen `parent A` in the top subtitle with a `← Back` affordance instead of a second body box, colors parent summaries by rarity accent, and opens a confirm screen after parent B before incubation starts.
- The confirm screen shows compact `parent A × parent B` cards only; offspring target traits stay hidden until incubation starts and are still derived from the static lookup table, parent cosmetics, floor-averaged rarity with a capped one-tier upgrade chance, forced `hat: "none"` on common offspring, and a 1% shiny chance.
- Incubating eggs persist as `settings.breedEgg` with parent UUIDs, target traits, and rarity-based timers: `10s` common, `30s` uncommon, `60s` rare, `120s` epic, `300s` legendary.
- Ready eggs hunt a real UUID whose deterministic roll output matches the stored target traits, persist that UUID as `breedEgg.hatchedUuid`, and reopen as the same buddy on later resumes.
- The hatch reveal now reuses the shared rarity-accented buddy card renderer, so hatched sprite/text/stats stay color-consistent with roll and current views.
- The hatch screen offers Add, Equip, and Delete. Add and Equip still stop at `maxBuddy`, while Delete discards the hatch and clears the egg intentionally.
- If hatch Add or Equip fails, the egg remains in settings so the user can retry later instead of losing it.
- Collection output surfaces expose current capacity as `current/maxBuddy` in both the TUI collection subtitle/status and the plain CLI summary.
- The TUI shell bottom area now renders only the current screen footer/action hints; transient status messages stay in state logic but are not shown in a dedicated bottom row.
- `CB_ZOO_DATA_DIR` is validated so cb-zoo state cannot be redirected into protected Claude state directories such as `.claude` or Windows `%APPDATA%\\Claude`.
- Sprite rendering always returns a 5-line frame so reveal layout and hat placement stay aligned.
- Terminal output supports both animated and plain-text reveal paths.
- Release verification runs through `npm run release:verify`, which chains syntax/package checks, the full test suite, CLI smoke checks, and coverage.
- `npm run release:check` adds `npm pack --dry-run`, and CI mirrors that gate on Ubuntu and Windows without publishing.

## Test Surface

- Deterministic hashing and roll output
- 5-line sprite rendering contract
- Settings load/save plus legacy `backup.json` migration
- Roll-charge refill math, clamping, and zero-charge gating
- Breed-egg load/save, invalid egg payload dropping, and `bredFrom` collection-entry persistence
- UUID backup/apply/restore, including BOM-tolerant config parsing and pinned restore metadata in `settings.json`
- Claude account-state resolver ordering across primary and fallback paths
- Invalid backup rejection before config or collection mutation
- Collection persistence, capacity enforcement, and summary formatting
- Corrupt collection rejection without overwriting local data
- Pending buddy persistence, rollback, and resume behavior in the TUI
- Breed-table symmetry/balance, offspring-trait generation, UUID hunting, incubating egg resume, stable ready-egg reopening, hatch actions, and recoverable full-collection failures
- CLI help rendering
- CLI smoke coverage for `--help`, `--collection`, `--current`, and plain quick-roll prompt behavior
- Unknown-flag rejection
- Invalid prompt input re-prompting without extra rolls
- Zero-charge CLI blocking before backup or reveal side effects
- `FORCE_COLOR=0` ANSI disable behavior
- Empty non-TTY stdin fail-fast before roll state changes
- Package metadata and release script contract checks
