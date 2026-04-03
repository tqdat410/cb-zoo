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
- Unified local settings saved in `~/.cb-zoo/settings.json` for backup data, collection capacity, pending roll state, and breed config/state
- Shared roll-charge tracking in `~/.cb-zoo/settings.json`, with configurable regen interval and max-charge cap
- Local collection saved in `~/.cb-zoo/collection.json`
- Collection surfaces show current capacity, and saves stop at `maxBuddy` entries (`50` by default)
- TUI rolls persist unsaved reveals so the "Resume Roll" action restores the pending buddy after backing out or restarting
- TUI breeding uses configurable slot-based incubation stored in `settings.json`, so multiple eggs can survive restarts and hatch from a dedicated slot picker
- HOME keeps a stable `Breed Buddy` action while a slot summary box shows ready, incubating, and empty breed slots
- Backup and restore flow for the original Claude UUID
- Zero runtime npm dependencies

## Breeding Tree

Breed results are symmetric: `duck × goose` gives the same offspring as `goose × duck`. Breeding the same species with itself returns that same species.

| A × B | duck | goose | blob | cat | dragon | octopus | owl | penguin | turtle | snail | ghost | axolotl | capybara | cactus | robot | rabbit | mushroom | chonk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| duck | duck | goose | duck | cat | dragon | axolotl | owl | penguin | turtle | snail | snail | duck | duck | owl | duck | goose | duck | duck |
| goose | goose | goose | blob | goose | dragon | octopus | owl | penguin | goose | snail | ghost | axolotl | capybara | cactus | goose | rabbit | mushroom | chonk |
| blob | duck | blob | blob | blob | dragon | blob | owl | penguin | turtle | snail | dragon | penguin | goose | dragon | blob | blob | blob | blob |
| cat | cat | goose | blob | cat | dragon | octopus | owl | cat | turtle | cat | ghost | cat | cat | cactus | cat | cat | cat | cat |
| dragon | dragon | dragon | dragon | dragon | dragon | dragon | dragon | penguin | turtle | snail | ghost | dragon | capybara | cactus | robot | rabbit | mushroom | chonk |
| octopus | axolotl | octopus | blob | octopus | dragon | octopus | owl | penguin | octopus | snail | ghost | axolotl | octopus | cactus | octopus | octopus | mushroom | octopus |
| owl | owl | owl | owl | owl | dragon | owl | owl | penguin | turtle | owl | ghost | axolotl | capybara | cactus | robot | owl | mushroom | chonk |
| penguin | penguin | penguin | penguin | cat | penguin | penguin | penguin | penguin | turtle | snail | ghost | axolotl | capybara | duck | robot | rabbit | penguin | chonk |
| turtle | turtle | goose | turtle | turtle | turtle | octopus | turtle | turtle | turtle | snail | ghost | axolotl | capybara | cactus | robot | rabbit | turtle | turtle |
| snail | snail | snail | snail | cat | snail | snail | owl | snail | snail | snail | ghost | axolotl | capybara | cactus | robot | goose | mushroom | blob |
| ghost | snail | ghost | dragon | ghost | ghost | ghost | ghost | ghost | ghost | ghost | ghost | axolotl | capybara | cactus | robot | rabbit | mushroom | blob |
| axolotl | duck | axolotl | penguin | cat | dragon | axolotl | axolotl | axolotl | axolotl | axolotl | axolotl | axolotl | capybara | duck | robot | rabbit | mushroom | goose |
| capybara | duck | capybara | goose | cat | capybara | octopus | capybara | capybara | capybara | capybara | capybara | capybara | capybara | goose | robot | rabbit | duck | chonk |
| cactus | owl | cactus | dragon | cactus | cactus | cactus | cactus | duck | cactus | cactus | cactus | duck | goose | cactus | robot | rabbit | mushroom | chonk |
| robot | duck | goose | blob | cat | robot | octopus | robot | robot | robot | robot | robot | robot | robot | robot | robot | rabbit | octopus | chonk |
| rabbit | goose | rabbit | blob | cat | rabbit | octopus | owl | rabbit | rabbit | goose | rabbit | rabbit | rabbit | rabbit | rabbit | rabbit | mushroom | chonk |
| mushroom | duck | mushroom | blob | cat | mushroom | mushroom | mushroom | penguin | turtle | mushroom | mushroom | mushroom | duck | mushroom | octopus | mushroom | mushroom | chonk |
| chonk | duck | chonk | blob | cat | chonk | octopus | chonk | chonk | turtle | blob | blob | goose | chonk | chonk | chonk | chonk | chonk | chonk |

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

### Recommended First Run

Back up your current Claude UUID before doing anything else:

```bash
cb-zoo --backup
```

This stores your original UUID in `~/.cb-zoo/settings.json` so you can always restore it later.

### Normal Use

Open the TUI:

```bash
cb-zoo
```

Then use:

- `Roll Buddy` to roll or resume a pending reveal
- `Collection` to browse, apply, or delete saved buddies
- `Breed Buddy` to manage breed slots, incubate eggs, and hatch offspring
- `Current Buddy` to inspect the UUID currently applied to Claude Code
- `Edit Current Buddy` to rename the stored companion or change personality text

### Useful CLI Shortcuts

```bash
cb-zoo --quick
cb-zoo --current
cb-zoo --collection
cb-zoo --restore
```

- `cb-zoo --quick` runs the fast plain reveal flow
- `cb-zoo --current` prints the currently active buddy
- `cb-zoo --collection` prints the saved collection
- `cb-zoo --restore` restores the backed-up UUID

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

## Recommended Safety Flow

1. Run `cb-zoo --backup` once before your first reroll.
2. Keep that backup UUID untouched unless you intentionally want to replace it.
3. If something looks wrong after rerolling or breeding, run `cb-zoo --restore`.
4. Re-run `cb-zoo --backup` only if you intentionally want to pin a different baseline UUID.

If you skip the backup step, recovery is weaker. The safest habit is: back up first, then roll.

## settings.json Reference

Main local state lives in:

```bash
~/.cb-zoo/settings.json
```

Typical shape:

```json
{
  "backup": {
    "uuid": "00000000-0000-4000-8000-000000000000",
    "stateFile": "C:\\Users\\you\\.claude.json",
    "backedUpAt": "2026-04-03T12:00:00.000Z"
  },
  "maxBuddy": 50,
  "rollConfig": {
    "maxCharges": 100,
    "regenMs": 300000
  },
  "rollCharges": {
    "available": 100,
    "updatedAt": 1775217600000
  },
  "breedConfig": {
    "slotCount": 3,
    "hatchTimes": {
      "common": 10000,
      "uncommon": 30000,
      "rare": 60000,
      "epic": 120000,
      "legendary": 300000
    }
  },
  "breedSlots": [
    null,
    null,
    null
  ],
  "pendingBuddy": null
}
```

Field meanings:

- `backup`
  Stores your original Claude UUID so `cb-zoo --restore` can put Claude back to the old state.
- `backup.uuid`
  The original UUID you backed up.
- `backup.stateFile`
  Which Claude state file that UUID came from.
- `backup.backedUpAt`
  When the backup was created.
- `maxBuddy`
  Maximum number of buddies allowed in `collection.json`. Default: `50`.
- `rollConfig`
  User-editable reroll settings.
- `rollConfig.maxCharges`
  Maximum reroll charges you can hold. Default: `100`.
- `rollConfig.regenMs`
  Milliseconds needed to regenerate `1` reroll charge. Default: `300000` (`5` minutes).
- `rollCharges`
  Runtime reroll state. Usually let cb-zoo manage this automatically.
- `rollCharges.available`
  Current reroll charges available right now.
- `rollCharges.updatedAt`
  Last timestamp used for lazy reroll regeneration math.
- `breedConfig`
  User-editable breeding settings.
- `breedConfig.slotCount`
  Number of breed slots shown in the TUI. Default: `3`.
- `breedConfig.hatchTimes`
  Millisecond hatch time per rarity.
- `breedConfig.hatchTimes.common`
  Default `10000` (`10` seconds).
- `breedConfig.hatchTimes.uncommon`
  Default `30000` (`30` seconds).
- `breedConfig.hatchTimes.rare`
  Default `60000` (`1` minute).
- `breedConfig.hatchTimes.epic`
  Default `120000` (`2` minutes).
- `breedConfig.hatchTimes.legendary`
  Default `300000` (`5` minutes).
- `breedSlots`
  Runtime breed-slot state. Each array item is either `null` or one persisted egg.
- `breedSlots[n].parentA`
  UUID of parent A.
- `breedSlots[n].parentB`
  UUID of parent B.
- `breedSlots[n].species`
  Target offspring species for that egg.
- `breedSlots[n].eye`
  Target offspring eye.
- `breedSlots[n].hat`
  Target offspring hat.
- `breedSlots[n].rarity`
  Target offspring rarity.
- `breedSlots[n].shiny`
  Whether the egg is targeting a shiny offspring.
- `breedSlots[n].createdAt`
  When that egg was created, in Unix milliseconds.
- `breedSlots[n].hatchAt`
  When that egg becomes ready, in Unix milliseconds.
- `breedSlots[n].hatchedUuid`
  Optional. Set after a ready egg has already resolved to a real UUID, so reopening the slot gives the same offspring again.
- `pendingBuddy`
  Runtime pending reveal state for the roll screen. `null` when no unsaved reveal exists.
- `pendingBuddy.uuid`
  UUID of the revealed buddy.
- `pendingBuddy.species`, `rarity`, `eye`, `hat`, `shiny`, `total`
  Snapshot of the revealed buddy.
- `pendingBuddy.rolledAt`
  ISO timestamp for when that reveal was created.

What you can safely edit:

- `maxBuddy`
- `rollConfig.maxCharges`
- `rollConfig.regenMs`
- `breedConfig.slotCount`
- `breedConfig.hatchTimes.*`

What you should usually not edit by hand:

- `rollCharges`
- `breedSlots`
- `pendingBuddy`
- `backup`

These are runtime or recovery fields. Wrong values here can block roll, breed, backup, or restore paths until fixed.

## Safety Notes

- The tool edits `oauthAccount.accountUuid` for rerolls and can also edit `companion.name` and `companion.personality` for the current stored buddy.
- The original UUID is backed up inside `~/.cb-zoo/settings.json` on first run. Existing `~/.cb-zoo/backup.json` files migrate automatically on first settings load.
- Keep that backup UUID. It is your clean way back to the original Claude state after rerolls, experiments, or failed edits.
- `settings.json` also stores `maxBuddy`, the current TUI `pendingBuddy`, `breedConfig.slotCount`, `breedConfig.hatchTimes`, and persisted `breedSlots`; `maxBuddy` defaults to `50`.
- Default breed config is `3` slots with rarity hatch timers of `10000`, `30000`, `60000`, `120000`, and `300000` ms for `common` through `legendary`, and users can override those values directly in `settings.json`.
- Legacy single-slot `breedEgg` data migrates into `breedSlots[0]` on load, so older installs keep their in-progress egg.
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
