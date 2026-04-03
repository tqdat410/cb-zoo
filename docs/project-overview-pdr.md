# Project Overview PDR

## Product

`cb-zoo` is a zero-dependency Node.js terminal app that rolls Claude Code buddies from random UUIDs, presents them through a centered cb-zoo TUI or explicit plain CLI flows, stores local settings in `~/.cb-zoo/settings.json`, stores the collection in `~/.cb-zoo/collection.json`, supports a TUI-only breed/egg loop for saved buddies, and optionally applies the rolled UUID back into Claude Code.

## Goals

- Match the public buddy-generation algorithm used by `claude-petpet`
- Stay cross-platform on Windows, macOS, and Linux
- Keep installation friction low by avoiding external dependencies
- Protect the user's original Claude UUID with backup and restore commands stored in unified local settings
- Let users resume an unsaved TUI roll instead of losing it on back-out or restart
- Let users incubate a bred buddy across TUI exits or app restarts without losing the egg
- Track parent lineage for bred buddies inside local collection storage

## Functional Requirements

- Roll a deterministic buddy from any UUID
- Launch a centered default interactive TUI for TTY runs
- Render a shared rarity palette across reveal, current, and collection surfaces: `common` neutral, `uncommon` green, `rare` blue, `epic` magenta, `legendary` gold
- Back up the current Claude UUID inside `~/.cb-zoo/settings.json` before first modification
- Apply a new UUID into the resolved Claude account state file, preferring `~/.claude.json` or `$CLAUDE_CONFIG_DIR/.claude.json`
- Update the current stored companion `name` and `personality` without changing UUID-derived bones
- Restore the original UUID from backup data stored in `~/.cb-zoo/settings.json`
- Auto-migrate legacy `~/.cb-zoo/backup.json` into `settings.json` on first settings load
- In the default TUI, save selected rolls to the local collection (`~/.cb-zoo/collection.json`) only when the user chooses Add or Equip
- Enforce collection capacity from `settings.maxBuddy`, defaulting to `50`
- Show collection capacity as `current/maxBuddy` in collection views
- Persist the current revealed TUI roll as `pendingBuddy`, keep it on Back or relaunch, and clear it after successful Add or Equip
- Expose a stable TUI-only `Breed Buddy` action, while HOME summarizes ready, incubating, and empty breed slots separately instead of renaming the menu item
- Store breed settings in `settings.breedConfig.slotCount` and `settings.breedConfig.hatchTimes`, defaulting to `3` slots and `10000/30000/60000/120000/300000` ms for `common` through `legendary`
- Open breeding on a slot picker that defaults to the first ready slot, otherwise the first occupied slot, otherwise slot 1
- Start breeding whenever at least two saved collection entries exist, even if a pending roll or a full collection is already present
- Require the second parent to resolve to a different UUID than the first parent
- Derive offspring traits only after pairing confirmation using a static species table, parent-inherited cosmetics, floor-averaged rarity with a capped one-tier upgrade chance, forced `hat: "none"` on common offspring, and a 1% shiny chance
- Persist incubating eggs as ordered `settings.breedSlots` entries with parent UUIDs, target traits, `createdAt`, and `hatchAt`, and migrate legacy `settings.breedEgg` into `breedSlots[0]` on first load
- Resume incubating eggs after leaving the breed screen or restarting the app, and hatch ready eggs into a stable UUID-backed buddy via per-slot persisted `hatchedUuid`
- Offer Add, Equip, and Delete actions after hatch time finishes, with Add and Equip still blocked by `maxBuddy` when the collection is full
- Save bred buddies back into the collection with optional `bredFrom` lineage metadata, and clear only the selected breed slot after a successful Add, Equip, or Delete path
- Let the TUI Collection view apply the selected buddy UUID without removing the saved entry, or delete the selected buddy after explicit confirmation
- Reject malformed UUID values and invalid Claude config shapes before config writes
- Reject companion metadata edits when Claude state has no valid stored companion yet or when trimmed edit values are blank
- Reject invalid backup data before backup, apply, or restore continues
- Reject invalid collection data before roll mode creates backups, reveals buddies, or writes local state
- Reject pre-existing temporary write paths instead of following them during config or collection writes
- Render each buddy as a stable 5-line ASCII sprite
- Support `--plain`, `--quick`, `--collection`, `--current`, `--set-name`, `--set-personality`, `--backup`, `--restore`, and `--help`

## Non-Functional Requirements

- Node.js 18+
- ESM only
- Zero npm dependencies
- Manual npm releases must pass the local `npm run release:check` gate before publish
- GitHub Actions must verify test and release-check health without performing publish
- No token or config leakage in logs
- Restore terminal cursor/state cleanly after TUI exit or failure
- Show a minimum-size warning instead of the full TUI when the terminal is smaller than `64x24`
- Default breed incubation timing starts at `10s` common, `30s` uncommon, `60s` rare, `120s` epic, and `300s` legendary, but actual hatch timing must come from `settings.breedConfig.hatchTimes`
- Atomic JSON writes for config, settings, and collection files
- BOM-tolerant JSON parsing for persisted state files
- Fail closed on corrupt settings, backup, or collection data, while dropping invalid pending roll, invalid breed-slot payloads, or invalid legacy `breedEgg` migration payloads instead of resuming them
- Prevent cb-zoo state files from being redirected into protected Claude state directories such as `.claude` or Windows `%APPDATA%\\Claude` through env overrides

## Risks

- Claude Code may change the salt or config schema
- Claude Code does not document `.claude.json` as a stable public API
- Re-auth inside Claude Code may overwrite a rerolled UUID
- Terminal ANSI support varies across shells

## Validation

- Node built-in tests pass with `npm test`
- Local release verification passes with `npm run release:check`
- GitHub Actions mirrors the release gates on push and pull request without publishing
- CLI help and collection views run without Claude config access
- TUI layout refuses sub-`64x24` terminals with a minimum-size warning instead of rendering clipped chrome
- UUID backup/apply/restore flow preserves unrelated config fields and tolerates a UTF-8 BOM in Claude config
- Quick roll rejects corrupt backup or collection files before backup, reveal, or local mutation
- Breed table tests prove symmetric parent lookup coverage and balanced offspring distribution across species
- Settings tests cover `breedConfig` defaults, `breedSlots` round-trips, legacy `breedEgg` migration, and dropping invalid persisted egg payloads
- TUI breed tests cover slot selection defaults, parent selection, configurable hatch timing, egg persistence/resume, stable ready-egg reopening, non-zero slot resume, hatch Add/Equip/Delete, lineage persistence, duplicate-parent rejection, and full-collection recovery
- Sprite rendering keeps a 5-line contract for stable card layout
