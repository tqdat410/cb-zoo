# Project Changelog

## 2026-04-03

- Changed the TUI rarity palette so common buddies stay neutral, uncommon renders green, rare buddies render blue, epic stays magenta, and legendary stays gold
- Extended rarity accents to the buddy outer frame in reveal, current, and collection surfaces
- Renamed the TUI `Archive` surface to `Collection`
- Added TUI collection actions for applying the selected buddy without removing it from storage and deleting it behind an inline confirmation step
- Center-aligned the default TUI shell on wide terminals instead of anchoring it to the left edge
- Replaced the hand-drawn home banner with a layout-safe framed intro block to stop right-edge drift
- Normalized reveal-stage centering around shared shell metrics instead of per-view fixed widths
- Refreshed TUI and core docs copy so cb-zoo no longer describes itself with borrowed crossover wording
- Fixed ANSI accent persistence so reveal/current/collection buddy text returns to the selected rarity color after embedded style resets, keeping `epic` purple and `legendary` gold across text and frame chrome

## 2026-04-02

- Refined the cb-zoo TUI roll flow so revealed buddies are not auto-added to the collection
- Added explicit TUI roll actions for `Equip`, `Add`, `Reroll`, and `Back`
- Made TUI `Equip` save the revealed buddy before applying its UUID, while `Add` saves without applying
- Removed the solid blue TUI background fill and leaned on rarity-colored accents instead
- Switched interactive no-flag runs to a default centered TUI with keyboard navigation and shared shell layout
- Added a raw ANSI TUI layer for home, roll, current, collection, and edit buddy flows while keeping explicit CLI flags and non-TTY fallback behavior
- Added `--plain` as an escape hatch to the legacy line-oriented roll flow
- Added routing and shared-shell regression coverage for the new default mode
- Added `--set-name` and `--set-personality` so users can edit stored companion metadata without changing UUID-derived bones
- Reused the resolved Claude state write path for companion metadata updates and rejected blank edit values or missing companion state
- Standardized Claude account state path resolution around `.claude.json`
- Added fallback support for `CLAUDE_CONFIG_DIR/.claude.json`, legacy `.config.json`, and Windows `%APPDATA%\\Claude\\config.json`
- Kept writes restricted to `oauthAccount.accountUuid` plus the current stored companion `name` / `personality`
- Pinned restore operations to the originally backed-up Claude state file and rejected tampered backup target paths
- Added regression coverage for resolver ordering, authoritative sandbox overrides, pinned restore behavior, Windows appdata directory guards, and read-only `userID` compatibility
- Updated docs to stop claiming `.claude/.config.json` as the canonical path
- Switched the buddy engine hash from FNV-1a to wyhash so UUID rolls match the current Claude companion bones
- Updated `--current` to merge stored companion soul data with UUID-regenerated rarity, species, cosmetics, and stats
- Cleared stored companion cache on apply and restore so Claude can hatch a fresh soul after a UUID change

## 2026-04-01

- Implemented the initial `cb-zoo` CLI scaffold
- Added deterministic buddy roll engine based on the public `claude-petpet` algorithm
- Added Claude UUID backup, apply, and restore flows
- Added collection persistence and collection grid rendering
- Added ASCII sprites, animated reveal mode, and quick reveal mode
- Added Node built-in tests for deterministic rolls and filesystem flows
- Added a coverage script and regression tests for CLI safety paths
- Hardened JSON parsing so BOM-prefixed Claude config files still load
- Rejected invalid `backup.json` payloads and malformed UUID values before backup/apply/restore paths can mutate config
- Rejected corrupt `collection.json` before roll mode can create backups, reveal buddies, or overwrite local data
- Rejected pre-existing temp write paths instead of following them during config and collection writes
- Rejected `CB_ZOO_DATA_DIR` overrides that point into `.claude`
- Added regression coverage for the fixed 5-line sprite rendering contract
- Hardened CLI input handling for unknown flags and empty stdin
