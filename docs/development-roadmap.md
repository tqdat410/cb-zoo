# Development Roadmap

## Status

- Phase 1: Project Setup & Core Engine - complete
- Phase 2: UUID Manager & Config - complete
- Phase 3: Sprites & Gacha Animation - complete
- Phase 4: Collection System & CLI - complete
- Phase 5: Breed Flow & Egg Persistence - complete

## Recent Hardening

- Added configurable roll charges inside `~/.cb-zoo/settings.json` through `rollConfig.maxCharges` and `rollConfig.regenMs`, defaulting to `100` rolls and `5` minutes per refill.
- Added persisted `rollCharges` state with lazy refill math so plain CLI and TUI consume the same shared roll budget without background timers.
- New-roll and reroll paths now stop cleanly at `0` charges, while `Resume Roll` still opens an already revealed pending buddy without spending another charge.
- Plain CLI now refunds a just-spent charge if collection persistence fails before the reveal prompt, while the TUI only decrements charges when it can atomically persist `pendingBuddy`, keeping bad local state fail-closed.
- The shared shell header now shows current reroll inventory plus the next-refill countdown in the top-right corner, updates live once per second, and the reveal screen still marks reroll unavailable until at least one charge comes back.
- Added a TUI-only Breed Buddy flow that selects two saved collection entries through a collection-style picker, pauses on a confirm screen after parent B, and then starts incubation before saving the hatched buddy back into the collection.
- Breed select-b now shows the chosen parent in the top subtitle with a `← Back` affordance, keeps the main body to list + highlighted detail only, and the confirm step now shows compact `parent A × parent B` cards with rarity-matched subtitle accents instead of an offspring preview.
- Breed eggs now persist in `~/.cb-zoo/settings.json` as `breedEgg`, survive app restarts, and switch the home action between `Breed Buddy`, `View Egg`, and `Hatch Egg`.
- Breeding now stays accessible even at full collection capacity, while the hatch screen explicitly offers Add, Equip, or Delete once the egg is ready.
- Bred buddies now keep lineage metadata in collection storage through `bredFrom: [parentAUuid, parentBUuid]`.
- Ready eggs now persist `hatchedUuid` after the first successful UUID hunt so reopen/restart resumes the same offspring instead of rehunting.
- Unified local cb-zoo state under `~/.cb-zoo/settings.json`, auto-migrating legacy `backup.json` and storing backup metadata, `maxBuddy`, and pending roll state in one file.
- Collection surfaces now show count/capacity, default `maxBuddy` remains `50`, and roll Add/Equip paths refuse to overflow a full collection.
- TUI roll state now persists unsaved reveals, keeps them on Back, and re-enters the revealed buddy through "Resume Roll" after app restart.
- Added a TUI-only breed loop with parent selection, persisted egg timers, ready-to-hatch resume behavior, and lineage-aware offspring saves.
- Added npm release metadata, repo hygiene files, a committed lockfile, and a manual release runbook.
- Added built-in release verification scripts for syntax, package contract, CLI smoke flows, coverage, and `npm pack --dry-run`.
- Added GitHub Actions CI gates for cross-platform tests plus Ubuntu and Windows release-check lanes without automated publish.
- Interactive TTY runs now enter a default centered cb-zoo TUI, while non-interactive and explicit flag flows stay on plain CLI-safe paths.
- Added a lightweight raw-ANSI TUI runtime with a centered shared shell, keyboard navigation, roll stage, current buddy view, collection browser, and buddy profile editor.
- Refreshed rarity accents so common buddies stay neutral, uncommon renders green, rare buddies render blue, epic stays magenta, legendary stays gold, and buddy frames inherit rarity color across roll/current/collection surfaces.
- Upgraded the TUI Collection view so it can apply the selected buddy without removing it from storage or delete it after an explicit confirmation step.
- Refined the TUI roll stage so reveal no longer auto-saves, Add stores explicitly, Equip stores and applies in one step, and the shell now uses rarity accents without the old flat blue background fill.
- Tiny terminals now show a minimum-size warning instead of rendering a clipped TUI shell.
- Claude config parsing now tolerates a leading UTF-8 BOM.
- Invalid `settings.json`, malformed backup payloads, malformed UUID values, and bad config container shapes now block backup/apply/restore flow until the state is fixed.
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
- Decide whether future hatch reveals should reuse the existing roll screen instead of the dedicated hatch surface
