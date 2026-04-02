# cb-zoo

`cb-zoo` is a zero-dependency Node.js CLI for rolling, collecting, and applying Claude Code buddies with a gacha-style terminal reveal.

## Features

- Deterministic buddy rolls matching the public `claude-petpet` algorithm
- Cross-platform Claude UUID backup, apply, and restore flow
- Local collection tracking in `~/.cb-zoo/collection.json`
- Animated reveal mode plus instant `--quick` mode
- No npm dependencies

## Requirements

- Node.js 18+
- Claude Code initialized at least once so `~/.claude/.config.json` exists

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
- In non-interactive use, pipe input such as `q`, `r`, or `a`. Empty stdin fails fast before backup or collection writes.

## Environment Overrides

These are optional and mainly useful for testing or sandboxed runs:

- `CB_ZOO_HOME`
- `CB_ZOO_CLAUDE_DIR`
- `CB_ZOO_CONFIG_FILE`
- `CB_ZOO_DATA_DIR`

## Safety Notes

- The tool edits `oauthAccount.accountUuid` inside `~/.claude/.config.json`.
- The original UUID is backed up to `~/.cb-zoo/backup.json` on first run.
- Re-authenticating Claude Code can overwrite the rerolled UUID, so keep the backup.
- Unknown flags fail fast, and roll mode refuses to proceed when backup data is corrupt or stdin is unavailable.

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
