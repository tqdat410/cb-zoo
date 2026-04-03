# Development Roadmap

## Status

- Phase 1: Project Setup & Core Engine - complete
- Phase 2: UUID Manager & Config - complete
- Phase 3: Sprites & Gacha Animation - complete
- Phase 4: Collection System & CLI - complete

## Recent Hardening

- Added npm release metadata, repo hygiene files, a committed lockfile, and a manual release runbook.
- Added built-in release verification scripts for syntax, package contract, CLI smoke flows, coverage, and `npm pack --dry-run`.
- Added GitHub Actions CI gates for cross-platform tests plus Ubuntu and Windows release-check lanes without automated publish.
- Interactive TTY runs now enter a default centered cb-zoo TUI, while non-interactive and explicit flag flows stay on plain CLI-safe paths.
- Added a lightweight raw-ANSI TUI runtime with a centered shared shell, keyboard navigation, roll stage, current buddy view, collection browser, and buddy profile editor.
- Refreshed rarity accents so common buddies stay neutral, uncommon renders green, rare buddies render blue, epic stays magenta, legendary stays gold, and buddy frames inherit rarity color across roll/current/collection surfaces.
- Upgraded the TUI `Collection` view so it can apply the selected buddy without removing it from storage or delete it after an explicit confirmation step.
- Refined the TUI roll stage so reveal no longer auto-saves, `Add` stores explicitly, `Equip` stores and applies in one step, and the shell now uses rarity accents without the old flat blue background fill.
- Tiny terminals now show a minimum-size warning instead of rendering a clipped TUI shell.
- Claude config parsing now tolerates a leading UTF-8 BOM.
- Invalid `backup.json`, malformed UUID values, and bad config container shapes now block backup/apply/restore flow until the state is fixed.
- Companion metadata edits now allow updating stored buddy `name` and `personality` without changing UUID-derived bones, and reject blank values or missing companion state.
- Invalid `collection.json` now blocks roll mode before backup, reveal, or collection writes instead of being silently replaced.
- Existing temporary write paths now block config and collection writes instead of being followed.
- `CB_ZOO_DATA_DIR` overrides that point into protected Claude state directories such as `.claude` or Windows `%APPDATA%\\Claude` are now rejected.
- Sprite regression coverage now locks the renderer to a 5-line contract.
- Claude account state resolution now prefers `.claude.json`, supports `CLAUDE_CONFIG_DIR`, and keeps legacy path fallbacks under regression coverage.
- The buddy engine now matches current Claude bones by hashing UUIDs with wyhash before feeding Mulberry32.
- Live companion cards now merge stored soul data with real UUID-regenerated rarity, species, cosmetics, and stats.

## Next Work

- Add richer end-to-end terminal animation verification
- Consider whether `cb-zoo` should pivot from UUID rerolling to companion inspection/export tooling for current Claude releases
- Consider whether companion metadata editing should eventually support an interactive prompt alias in addition to explicit flags
- Consider automated npm publish and provenance after the manual release flow settles
- Continue tuning shell behavior under extreme terminal resize cases if future screens outgrow the current width cap
- Re-check companion storage behavior if Claude Code changes its internal local-state schema again
