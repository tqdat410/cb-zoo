# cb-zoo

`cb-zoo` is a zero-dependency Node.js terminal app for rolling, collecting, and applying Claude Code buddies with a Pokemon handheld-style TUI and a gacha-style reveal flow.

## Features

- Deterministic buddy rolls from the active Claude UUID using the current Claude buddy hash pipeline
- Default interactive TUI styled like a Pokemon handheld shell
- Real `--current` companion inspection that merges stored soul data with UUID-regenerated buddy bones
- Cross-platform Claude UUID backup, apply, and restore flow
- Local collection tracking in `~/.cb-zoo/collection.json`
- Animated reveal mode plus instant `--quick` mode
- No npm dependencies

## Requirements

- Node.js 18+
- Claude Code initialized at least once so its account state file exists, usually `~/.claude.json` or `$CLAUDE_CONFIG_DIR/.claude.json`

## Usage

```bash
npm test
npm run test:coverage
node ./src/cli.js --help
node ./src/cli.js
node ./src/cli.js --plain
printf 'q\n' | node ./src/cli.js --quick
node ./src/cli.js --collection
node ./src/cli.js --current
node ./src/cli.js --set-name "Nova"
node ./src/cli.js --set-personality "Calm under pressure."
node ./src/cli.js --set-name "Nova" --set-personality "Calm under pressure."
node ./src/cli.js --backup
node ./src/cli.js --restore
```

## Default Mode

- Interactive TTY runs now open the handheld TUI by default.
- Non-interactive runs and explicit command flags keep using the plain CLI-safe paths.
- Use `--plain` if you want the legacy line-oriented roll flow in a real terminal.

## Roll Flow

- Roll mode always reveals a buddy, saves it to the local collection, then prompts `[A]pply`, `[R]eroll`, or `[Q]uit`.
- `--quick` skips animation, but it still uses the same prompt flow.
- In non-interactive use, pipe input such as `q`, `r`, or `a`. Empty stdin fails fast before backup or collection writes.

## Environment Overrides

These are optional and mainly useful for testing or sandboxed runs:

- `CLAUDE_CONFIG_DIR`
- `CB_ZOO_HOME`
- `CB_ZOO_CLAUDE_DIR`
- `CB_ZOO_CONFIG_FILE`
- `CB_ZOO_DATA_DIR`

## Safety Notes

- The tool edits `oauthAccount.accountUuid` for rerolls and can also edit `companion.name` / `companion.personality` for the current stored buddy.
- Current Claude Code builds store `companion.name`, `companion.personality`, and `hatchedAt`, but rarity/species/hat/stats are regenerated from the active UUID.
- Companion metadata edits require an existing stored `companion` object and do not change UUID-derived bones.
- Applying a new UUID clears the stored companion cache so Claude Code can hatch a fresh soul for the new bones.
- Current canonical target is `~/.claude.json` or `$CLAUDE_CONFIG_DIR/.claude.json`.
- Legacy/community fallback paths are used only when higher-priority `.claude.json` candidates are missing or unusable, including `~/.claude/.config.json` and `%APPDATA%\\Claude\\config.json` on Windows.
- The original UUID is backed up to `~/.cb-zoo/backup.json` on first run.
- Restore stays pinned to the same Claude state file that was originally backed up, and rejects tampered backup target paths.
- Re-authenticating Claude Code can overwrite the rerolled UUID, so keep the backup.
- Unknown flags fail fast, and roll mode refuses to proceed when backup data is corrupt or stdin is unavailable.
- Claude Code does not document this file schema as a stable public API, so future releases may change it.

## Project Layout

```text
src/
  buddy-engine.js
  claude-state.js
  cli.js
  collection.js
  companion-state.js
  config.js
  gacha-animation.js
  launch-mode.js
  sprites.js
  tui/
    app.js
    controller.js
    read-keypress.js
    render-helpers.js
    render-layout.js
    roll-flow.js
    state.js
    views/
      collection-view.js
      current-view.js
      edit-view.js
      home-view.js
      roll-view.js
  uuid-manager.js
  wyhash.js
test/
  buddy-engine.test.js
  companion-editing.test.js
  companion-state.test.js
  integration-flows.test.js
  launch-mode.test.js
  tui-controller.test.js
  tui-layout.test.js
  tui-renderers.test.js
test-support/
  with-temp-environment.js
```
