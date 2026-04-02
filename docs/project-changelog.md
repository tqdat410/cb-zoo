# Project Changelog

## 2026-04-02

- Standardized Claude account state path resolution around `.claude.json`
- Added fallback support for `CLAUDE_CONFIG_DIR/.claude.json`, legacy `.config.json`, and Windows `%APPDATA%\\Claude\\config.json`
- Kept writes restricted to `oauthAccount.accountUuid`
- Pinned restore operations to the originally backed-up Claude state file and rejected tampered backup target paths
- Added regression coverage for resolver ordering, authoritative sandbox overrides, pinned restore behavior, Windows appdata directory guards, and read-only `userID` compatibility
- Updated docs to stop claiming `.claude/.config.json` as the canonical path
- Switched `--current` to show the real Claude `companion` summary when live companion state exists
- Disabled roll/apply flow on current Claude builds where UUID rerolls no longer match the live companion
- Added regression coverage so companion mode fails before backup or collection mutations

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
