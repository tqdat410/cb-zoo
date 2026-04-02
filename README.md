# cb-zoo

`cb-zoo` is a zero-dependency Node.js CLI for rolling, collecting, and applying Claude Code buddies with a gacha-style terminal reveal.

## Features

- Legacy deterministic UUID buddy rolls for older Claude Code behavior
- Real `--current` companion inspection when Claude stores a live companion in `.claude.json`
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
printf 'q\n' | node ./src/cli.js --quick
node ./src/cli.js --collection
node ./src/cli.js --current
node ./src/cli.js --backup
node ./src/cli.js --restore
```

## Roll Flow

- Roll mode always reveals a buddy, saves it to the local collection, then prompts `[A]pply`, `[R]eroll`, or `[Q]uit`.
- `--quick` skips animation, but it still uses the same prompt flow.
- On current Claude Code builds with a live `companion` state, roll/apply is blocked because UUID rerolls no longer match the real buddy.
- In non-interactive use, pipe input such as `q`, `r`, or `a`. Empty stdin fails fast before backup or collection writes.

## Environment Overrides

These are optional and mainly useful for testing or sandboxed runs:

- `CLAUDE_CONFIG_DIR`
- `CB_ZOO_HOME`
- `CB_ZOO_CLAUDE_DIR`
- `CB_ZOO_CONFIG_FILE`
- `CB_ZOO_DATA_DIR`

## Safety Notes

- The tool edits `oauthAccount.accountUuid` inside the resolved Claude Code account state file.
- Current Claude Code builds can store the real buddy separately in `companion`, so UUID rerolls are now a legacy flow and may not affect the live buddy at all.
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
  cli.js
  collection.js
  config.js
  gacha-animation.js
  sprites.js
  uuid-manager.js
test/
  buddy-engine.test.js
  integration-flows.test.js
```
