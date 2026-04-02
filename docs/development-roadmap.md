# Development Roadmap

## Status

- Phase 1: Project Setup & Core Engine - complete
- Phase 2: UUID Manager & Config - complete
- Phase 3: Sprites & Gacha Animation - complete
- Phase 4: Collection System & CLI - complete

## Recent Hardening

- Claude config parsing now tolerates a leading UTF-8 BOM.
- Invalid `backup.json`, malformed UUID values, and bad config container shapes now block backup/apply/restore flow until the state is fixed.
- Invalid `collection.json` now blocks roll mode before backup, reveal, or collection writes instead of being silently replaced.
- Existing temporary write paths now block config and collection writes instead of being followed.
- `CB_ZOO_DATA_DIR` overrides that point into protected Claude state directories such as `.claude` or Windows `%APPDATA%\\Claude` are now rejected.
- Sprite regression coverage now locks the renderer to a 5-line contract.
- Claude account state resolution now prefers `.claude.json`, supports `CLAUDE_CONFIG_DIR`, and keeps legacy path fallbacks under regression coverage.
- Live Claude companion state now overrides the old UUID-derived buddy assumption: `--current` reads `companion`, and legacy roll/apply is blocked when that state is present.

## Next Work

- Add richer end-to-end terminal animation verification
- Add publish metadata and release workflow when the repo is moved into git
- Consider whether `cb-zoo` should pivot from UUID rerolling to companion inspection/export tooling for current Claude releases
- Re-check companion storage behavior if Claude Code changes its internal local-state schema again
