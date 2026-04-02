# System Architecture

## Modules

- `src/config.js`
  Exports static roll constants plus filesystem path helpers.

- `src/buddy-engine.js`
  Implements FNV-1a hashing, mulberry32 PRNG, rarity selection, stat generation, and `rollFrom(uuid)`.

- `src/uuid-manager.js`
  Resolves the Claude account state file, reads it with BOM-tolerant JSON parsing, validates UUID/config shapes and backup payloads, rejects pre-existing temp write paths, creates the first UUID backup, applies a new UUID, and restores the backup.

- `src/sprites.js`
  Stores ASCII species bodies and hat overlays, then renders a fixed 5-line sprite from roll traits.

- `src/gacha-animation.js`
  Handles ANSI capability checks, roll animation phases, and buddy card rendering.

- `src/collection.js`
  Validates persisted collection state, rejects pre-existing temp write paths, appends minimal roll entries, and renders the collection summary grid.

- `src/cli.js`
  Parses arguments and orchestrates rolling, applying, restoring, and collection views.

## Data Flow

1. CLI validates existing collection state before roll mode creates backups or reveals a new buddy.
2. CLI generates a random UUID.
3. Buddy engine rolls deterministic traits from `uuid + salt`.
4. Animation or quick reveal renders the buddy card.
5. Collection store appends a minimal record to `~/.cb-zoo/collection.json` only after the existing file parses as a valid buddy-entry array.
6. If the user applies the roll, UUID manager updates the resolved Claude account state file.

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
- Pre-existing temp write paths are rejected before config or collection writes.
- Missing backup throws a restore-specific error.
- Corrupt existing backups block roll mode and backup/apply/restore paths before any config or collection mutation.
- Invalid collection JSON or invalid entry shapes block roll mode before backup, reveal, or collection writes, and preserve the existing file for manual recovery.
- `CB_ZOO_DATA_DIR` cannot resolve to protected Claude state directories such as `.claude` or Windows `%APPDATA%\\Claude`, or any nested path inside them.
