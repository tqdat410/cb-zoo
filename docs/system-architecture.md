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

- `src/uuid-manager.js`
  Owns atomic Claude-state and backup writes, validates backup payloads, rejects pre-existing temp write paths, creates the first UUID backup, applies UUID changes, updates current companion metadata, and restores the backup.

- `src/sprites.js`
  Stores ASCII species bodies and hat overlays, then renders a fixed 5-line sprite from roll traits.

- `src/gacha-animation.js`
  Handles the legacy/plain reveal flow plus reusable buddy-card rendering.

- `src/launch-mode.js`
  Decides whether the app should launch the default TUI or stay on an explicit plain CLI path.

- `src/tui/*`
  Implements the Pokemon handheld TUI runtime: keypress handling, handheld frame rendering, state transitions, roll flow, and individual views.

- `src/collection.js`
  Validates persisted collection state, rejects pre-existing temp write paths, appends minimal roll entries, and renders the collection summary grid.

- `src/cli.js`
  Parses arguments and orchestrates rolling, applying, restoring, and collection views.

## Data Flow

1. Entry routing decides between the default TUI and explicit/plain CLI paths.
2. TUI or CLI validates existing collection state before roll mode creates backups or reveals a new buddy.
3. Buddy engine rolls deterministic traits from the UUID via wyhash-seeded Mulberry32.
4. TUI reveal stages or plain animation render the buddy card.
5. Collection store appends a minimal record to `~/.cb-zoo/collection.json` only after the existing file parses as a valid buddy-entry array.
6. If the user applies the roll, UUID manager updates the resolved Claude account state file.
7. If the user runs `--current` or opens the current-buddy TUI view, companion-state reads stored soul data, regenerates UUID-derived bones, and renders the merged summary.
8. If the user edits the current buddy name or personality, UUID manager mutates only those stored companion metadata fields and leaves UUID-derived bones unchanged.

## Storage

- Claude account state:
  - preferred: `~/.claude.json`
  - supported override: `$CLAUDE_CONFIG_DIR/.claude.json`
  - fallback-only legacy/community paths when preferred files are missing or unusable: `~/.claude/.config.json`, `%APPDATA%\\Claude\\config.json`
- Backup: `~/.cb-zoo/backup.json`
- Collection: `~/.cb-zoo/collection.json`

## Failure Handling

- Missing Claude account state throws a clear setup error with checked path candidates.
- BOM-prefixed JSON is normalized before parse.
- Malformed UUIDs and invalid config container shapes are rejected before config writes.
- Companion metadata edits fail closed when the resolved Claude state has no valid stored companion or when trimmed edit values are empty.
- TUI startup must restore terminal state on exit or thrown errors.
- Pre-existing temp write paths are rejected before config or collection writes.
- Missing backup throws a restore-specific error.
- Corrupt existing backups block roll mode and backup/apply/restore paths before any config or collection mutation.
- Invalid collection JSON or invalid entry shapes block roll mode before backup, reveal, or collection writes, and preserve the existing file for manual recovery.
- `CB_ZOO_DATA_DIR` cannot resolve to protected Claude state directories such as `.claude` or Windows `%APPDATA%\\Claude`, or any nested path inside them.
