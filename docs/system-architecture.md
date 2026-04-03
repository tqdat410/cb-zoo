# System Architecture

## Modules

- `src/config.js`
  Exports static roll constants plus filesystem path helpers.

- `src/buddy-engine.js`
  Implements wyhash-based seeding, mulberry32 PRNG, rarity selection, stat generation, and `rollFrom(uuid)`.

- `src/wyhash.js`
  Provides the wyhash helper used to seed deterministic buddy generation from UUID input.

- `src/claude-state.js`
  Resolves the Claude account state file, parses BOM-tolerant JSON, validates config and UUID shapes, and sanitizes readable/editable companion metadata.

- `src/companion-state.js`
  Reads the current stored companion, merges it with UUID-regenerated buddy bones for `--current`, and formats the current companion summary card.

- `src/settings-manager.js`
  Owns `~/.cb-zoo/settings.json`, migrates legacy `backup.json`, validates and normalizes backup data plus `maxBuddy` and `pendingBuddy`, and persists atomic settings writes.

- `src/uuid-manager.js`
  Owns atomic Claude-state writes, delegates backup persistence to `settings-manager`, rejects pre-existing temp write paths, creates the first UUID backup, applies UUID changes, updates current companion metadata, and restores the backup.

- `src/sprites.js`
  Stores ASCII species bodies and hat overlays, then renders a fixed 5-line sprite from roll traits.

- `src/gacha-animation.js`
  Handles the legacy/plain reveal flow plus reusable buddy-card rendering.

- `src/launch-mode.js`
  Decides whether the app should launch the default TUI or stay on an explicit plain CLI path.

- `src/tui/render-helpers.js`
  Owns shared TUI ANSI helpers, visible-width handling, and the single rarity-accent mapping used by roll, current, and collection surfaces.

- `src/tui/render-layout.js`
  Calculates centered shell metrics, enforces the bounded TUI width, and falls back to a minimum-size warning when the terminal is smaller than `64x24`.

- `src/tui/*`
  Implements the centered cb-zoo TUI runtime: keypress handling, framed shell rendering, state transitions, roll flow, and individual views.

- `src/collection.js`
  Validates persisted collection state, rejects pre-existing temp write paths, enforces `maxBuddy` capacity from settings, appends minimal roll entries only when the user saves a reveal, and removes saved entries on confirmed collection deletes.

- `src/cli.js`
  Parses arguments and orchestrates rolling, applying, restoring, and collection views.

- `scripts/check-release-contract.cjs`
  Verifies publish-facing repository invariants, required files, and syntax across `src/`, `scripts/`, `test/`, and `test-support/`.

- `scripts/smoke-cli.cjs`
  Exercises stable CLI smoke paths against temp fixtures so release checks cover shipped command behavior without touching real user state.

- `.github/workflows/ci.yml`
  Runs cross-platform test jobs plus a non-publishing release-check job on Ubuntu and Windows.

## Data Flow

1. Entry routing decides between the default TUI and explicit/plain CLI paths.
2. TUI or CLI validates existing collection state, and settings-backed flows load `~/.cb-zoo/settings.json` or migrate legacy `backup.json` into it on first read.
3. Buddy engine rolls deterministic traits from the UUID via wyhash-seeded Mulberry32.
4. Plain CLI reveal renders the buddy card and immediately tries to save the roll into `~/.cb-zoo/collection.json`, while the default TUI reveal persists the rolled buddy as `settings.pendingBuddy` and waits for an explicit Add or Equip.
5. If the user chooses Add or Equip from the TUI roll screen, collection storage appends a minimal record to `~/.cb-zoo/collection.json` only after the existing file parses as a valid buddy-entry array and current count is below `maxBuddy` (`50` by default).
6. If the user chooses Back from the TUI roll screen, cb-zoo returns home without mutating collection or UUID state and keeps `pendingBuddy` so the home action becomes "Resume Roll".
7. If the user chooses Equip, UUID manager updates the resolved Claude account state file after the collection write succeeds. If pending-clear or UUID-apply fails, the collection save is rolled back and the pending buddy is restored.
8. If the user opens the TUI Collection view, they can inspect saved buddies, see current count/capacity, apply the selected UUID directly without removing the saved entry, or delete the selected entry after confirmation. Collection apply creates the UUID backup first when needed.
9. If the user relaunches the TUI or re-enters roll while `pendingBuddy` exists, controller/state rebuild the revealed roll state and resume that buddy.
10. If the user runs `--current` or opens the current-buddy TUI view, companion-state reads stored soul data, regenerates UUID-derived bones, and renders the merged summary.
11. If the user edits the current buddy name or personality, UUID manager mutates only those stored companion metadata fields and leaves UUID-derived bones unchanged.

## Release Verification Flow

1. `npm run check` validates package publish contract, required repo files, and JavaScript syntax.
2. `npm run smoke` runs temp-fixture CLI smoke checks for help, collection, current, and plain quick-roll flows.
3. `npm run release:verify` chains contract checks, `npm test`, smoke checks, and `npm run test:coverage`.
4. `npm run release:check` adds `npm pack --dry-run`, and GitHub Actions mirrors that gate on Ubuntu and Windows without publishing.

## Storage

- Claude account state:
  - preferred: `~/.claude.json`
  - supported override: `$CLAUDE_CONFIG_DIR/.claude.json`
  - fallback-only legacy/community paths when preferred files are missing or unusable: `~/.claude/.config.json`, `%APPDATA%\\Claude\\config.json`
- Settings: `~/.cb-zoo/settings.json`
  - `backup`: original UUID plus pinned Claude state file metadata
  - `maxBuddy`: positive integer collection capacity, default `50`
  - `pendingBuddy`: last revealed-but-unsaved TUI buddy, cleared on successful Add or Equip
  - legacy `backup.json` is migrated into `settings.json` on first settings load
- Collection: `~/.cb-zoo/collection.json`

## Failure Handling

- Missing Claude account state throws a clear setup error with checked path candidates.
- BOM-prefixed JSON is normalized before parse.
- Malformed UUIDs and invalid config container shapes are rejected before config writes.
- Companion metadata edits fail closed when the resolved Claude state has no valid stored companion or when trimmed edit values are empty.
- TUI startup must restore terminal state on exit or thrown errors.
- TUI layout falls back to a minimum-size warning when the terminal is smaller than `64x24`.
- Pre-existing temp write paths are rejected before config, settings, or collection writes.
- Missing backup throws a restore-specific error.
- Invalid `settings.json` content blocks settings-backed flows until the file is fixed or removed.
- Malformed backup data inside `settings.json` blocks backup/apply/restore paths before any config mutation.
- Invalid `pendingBuddy` payloads are dropped to `null` on load instead of resuming bad state.
- Invalid collection JSON or invalid entry shapes block roll mode before backup, reveal, or collection writes, and preserve the existing file for manual recovery.
- Collection saves fail with `Collection full (n/max)` once saved entries reach `maxBuddy`, and failed TUI Add/Equip keeps the pending buddy available to resume.
- `CB_ZOO_DATA_DIR` cannot resolve to protected Claude state directories such as `.claude` or Windows `%APPDATA%\\Claude`, or any nested path inside them.
