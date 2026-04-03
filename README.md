# cb-zoo

`cb-zoo` is a zero-dependency Node.js CLI and terminal UI for rolling, collecting, and applying Claude Code buddies.

It is a `Claude Code` companion manager with a retro terminal UI, gacha-style roll flow, unified local settings storage, local collection tracking, and backup/restore support for Claude UUID state.

## Demo

<video src="https://res.cloudinary.com/do6szo7zy/video/upload/v1775198661/2026-04-03_13-33-27_dc1bmv.mp4" controls muted playsinline width="960"></video>

If the embedded video does not render on GitHub, [watch it here](https://res.cloudinary.com/do6szo7zy/video/upload/v1775198661/2026-04-03_13-33-27_dc1bmv.mp4).

<p align="center">
  <img src="./media/screenshot-reroll.png" alt="cb-zoo reroll screen" width="48%" />
  <img src="./media/screenshot-collection.png" alt="cb-zoo collection screen" width="48%" />
</p>

## Features

- Default interactive terminal UI for rolling and browsing buddies
- Fast plain CLI flow with `--quick` and `--plain`
- Interactive no-flag TTY launches the TUI, while explicit command flags and non-interactive runs stay on plain CLI-safe paths
- Current buddy inspection with UUID-derived traits plus stored profile data
- Unified local settings saved in `~/.cb-zoo/settings.json` for backup data, collection capacity, and pending roll state
- Shared roll-charge tracking in `~/.cb-zoo/settings.json`, with configurable regen interval and max-charge cap
- Local collection saved in `~/.cb-zoo/collection.json`
- Collection surfaces show current capacity, and saves stop at `maxBuddy` entries (`50` by default)
- TUI rolls persist unsaved reveals so the "Resume Roll" action restores the pending buddy after backing out or restarting
- TUI breeding lets you incubate an egg across restarts, then add, equip, or discard the hatched buddy from a dedicated hatch screen
- Backup and restore flow for the original Claude UUID
- Zero runtime npm dependencies

## Install

```bash
npm install -g cb-zoo
```

Or run it without a global install:

```bash
npx cb-zoo --help
```

## Requirements

- Node.js 18+
- Claude Code initialized at least once so its account state file exists, usually `~/.claude.json` or `$CLAUDE_CONFIG_DIR/.claude.json`

## Quick Start

```bash
cb-zoo
cb-zoo --quick
cb-zoo --current
cb-zoo --collection
cb-zoo --backup
cb-zoo --restore
```

## Commands

- `cb-zoo`
  Opens the default interactive TUI in a real terminal.
- `cb-zoo --quick`
  Uses the fast plain reveal flow.
- `cb-zoo --plain`
  Forces the legacy non-TUI CLI flow.
- `cb-zoo --current`
  Shows the current buddy by merging stored profile data with UUID-derived traits.
- `cb-zoo --collection`
  Shows the saved collection.
- `cb-zoo --set-name "Nova"`
  Updates the stored companion name.
- `cb-zoo --set-personality "Calm under pressure."`
  Updates the stored companion personality.
- `cb-zoo --backup`
  Creates the UUID backup in `~/.cb-zoo/settings.json` if it does not already exist.
- `cb-zoo --restore`
  Restores the backed-up UUID.

## Safety Notes

- The tool edits `oauthAccount.accountUuid` for rerolls and can also edit `companion.name` and `companion.personality` for the current stored buddy.
- The original UUID is backed up inside `~/.cb-zoo/settings.json` on first run. Existing `~/.cb-zoo/backup.json` files migrate automatically on first settings load.
- `settings.json` also stores `maxBuddy`, the current TUI `pendingBuddy`, and any active `breedEgg`; `maxBuddy` defaults to `50`.
- `settings.json` also stores `rollConfig.maxCharges` and `rollConfig.regenMs`; defaults are `100` rolls and one refill every `300000` ms.
- New rolls and rerolls spend one shared roll charge, while resuming an already pending reveal does not.
- Plain CLI refunds the spent charge if local persistence fails before the reveal reaches its Apply/Reroll/Quit prompt, and the TUI only commits a charge when it can persist the pending reveal in `settings.json`.
- When the collection is full, TUI Add/Equip keeps the pending buddy in place instead of discarding it.
- Breeding can still start while the collection is full, but hatched-buddy Add/Equip still respect `maxBuddy` until you free a slot or discard the hatch.
- Claude Code does not document this file schema as a stable public API, so future releases may change it.
- Re-authenticating Claude Code can overwrite the rerolled UUID, so keep the backup.

## For Maintainers

- Manual release steps live in [docs/deployment-guide.md](./docs/deployment-guide.md).
- Local release gate: `npm run release:check`
- CI workflow: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)
