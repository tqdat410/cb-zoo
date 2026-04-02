# Research Report: Claude Code `oauthAccount.accountUuid` Path Best Practice

Conducted: 2026-04-02

## Executive Summary

Best current conclusion: treat `~/.claude.json` as the primary Claude Code state file that may contain `oauthAccount.accountUuid`. Do not treat `~/.claude/.config.json` or `%APPDATA%\Claude\config.json` as the canonical default.

Reason: multiple current GitHub repos and issues converge on `~/.claude.json` for OAuth/account state, while Anthropic official docs only officially document `~/.claude/settings.json` for settings and do not publish a stable public schema for `oauthAccount.accountUuid`. That means `oauthAccount.accountUuid` is real in practice, but still an internal state shape, not an officially supported config API.

## Research Methodology

- Sources consulted: 8
- Date range: 2025-05 to 2026-04
- Search terms:
  - `accountUuid oauthAccount .claude.json`
  - `buddy reroll Claude Code config path`
  - `CLAUDE_CONFIG_DIR .claude.json`
  - `ClaudeAdapter ~/.claude.json`

## Key Findings

### 1. Official docs separate settings from internal account state

Anthropic docs currently document:

- User settings: `~/.claude/settings.json`
- Project settings: `.claude/settings.json`
- Managed settings on Windows: `C:\ProgramData\ClaudeCode\managed-settings.json`

Source:
- https://docs.anthropic.com/en/docs/claude-code/settings

Docs for IAM mention credential handling, but still do not define a public JSON schema for `oauthAccount.accountUuid`.

Source:
- https://docs.anthropic.com/en/docs/claude-code/iam

Implication: editing `oauthAccount.accountUuid` is working against an internal state file, not an official config contract.

### 2. Anthropic issue tracker points to `~/.claude.json`

Anthropic repo issue `#10972` explicitly discusses the `oauthAccount` key in `~/.claude.json` and shows a case where the file existed without that key after VS Code authentication.

Source:
- https://github.com/anthropics/claude-code/issues/10972

Anthropic repo issue `#1455` also states Claude Code writes config/cache to `~/.claude.json` and `~/.claude` by default.

Source:
- https://github.com/anthropics/claude-code/issues/1455

Implication: `~/.claude.json` is not rumor. It is part of current real-world Claude Code behavior.

### 3. Cross-tooling ecosystem converges on `~/.claude.json`

`icefort-ai/config` documents its Claude adapter as:

- `ClaudeAdapter` -> `~/.claude.json`
- includes `oauthAccount.accountUuid`, `emailAddress`, `organizationUuid`

Sources:
- https://github.com/icefort-ai/config
- https://raw.githubusercontent.com/icefort-ai/config/main/README.md

`docker/mcp-gateway` documents `CLAUDE_CONFIG_DIR` behavior as:

- default config dir `~/.claude`
- when overridden, Claude Code uses `$CLAUDE_CONFIG_DIR/.claude.json`

Source:
- https://github.com/docker/mcp-gateway

Implication: third-party tools integrating with Claude Code treat `.claude.json` as the actual machine-readable state file.

### 4. Buddy/account switcher repos mostly use `.claude.json`, with Windows fallback

`grayashh/buddy-reroll` path detection:

1. `CLAUDE_CONFIG_DIR/.config.json` as legacy fallback
2. `~/.claude.json` as default
3. `%APPDATA%\Claude\config.json` as Windows fallback

It reads:

- `config.oauthAccount?.accountUuid ?? config.userID ?? "anon"`

Source:
- https://github.com/grayashh/buddy-reroll
- https://raw.githubusercontent.com/grayashh/buddy-reroll/main/index.js

`ssut` account switcher gist also reads `.oauthAccount.accountUuid` from the path returned by `get_claude_config_path`, and its comments call out `.claude.json` as the current account source.

Source:
- https://gist.github.com/ssut/7c1c3f6c64ae3da21720be69ff0ff187

Implication: the stronger pattern is not `%APPDATA%\Claude\config.json` directly. The stronger pattern is `.claude.json` first, then fallback only if needed.

### 5. Local machine evidence supports `.claude.json`, not `%APPDATA%\Claude\config.json`

Local verification on this Windows machine:

- `C:\Users\Admin\.claude.json` exists
- `C:\Users\Admin\.claude\settings.json` exists
- `C:\Users\Admin\AppData\Roaming\Claude\config.json` exists

String presence check:

- `%USERPROFILE%\.claude.json` => `accountUuid`: yes, `oauthAccount`: yes, `userID`: yes
- `%APPDATA%\Claude\config.json` => `accountUuid`: no, `oauthAccount`: no, `userID`: no

Implication: on this machine, `%APPDATA%\Claude\config.json` is not the file you want for buddy/account UUID state.

## Comparative Analysis

### Approach A: Hardcode `~/.claude/.config.json`

Status: bad

- No strong current source support
- Conflicts with present-day ecosystem evidence
- Likely legacy or incorrect assumption

### Approach B: Hardcode `%APPDATA%\Claude\config.json` on Windows

Status: weak

- Seen as fallback in some community code
- Not supported by official docs as canonical Claude Code account-state path
- Fails on the current local machine checked here

### Approach C: Primary `~/.claude.json`, plus explicit fallbacks

Status: best

- Best alignment with Anthropic issues, third-party adapters, and current local evidence
- Compatible with `CLAUDE_CONFIG_DIR`
- Lets tool survive mixed installs / older layouts

## Best-Practice Recommendation

Use this resolution order:

1. If `CLAUDE_CONFIG_DIR` is set, use `${CLAUDE_CONFIG_DIR}/.claude.json`
2. Else use `%USERPROFILE%\.claude.json` on Windows or `~/.claude.json` on Unix-like systems
3. Only if missing, try legacy/community fallbacks:
   - `${CLAUDE_CONFIG_DIR}/.config.json`
   - `%APPDATA%\Claude\config.json` on Windows
4. Validate JSON shape before use:
   - prefer `oauthAccount.accountUuid`
   - fallback to `userID` only for read-only compatibility
5. Fail closed if no valid identity field exists
6. Back up before any mutation
7. Warn clearly that this file format is internal and may change across Claude Code releases

## Implementation Guidance

Recommended logic:

```js
function resolveClaudeStateFile() {
  const home = os.homedir();
  const configDir = process.env.CLAUDE_CONFIG_DIR;
  const candidates = [
    configDir && path.join(configDir, ".claude.json"),
    path.join(home, ".claude.json"),
    configDir && path.join(configDir, ".config.json"),
    process.platform === "win32" && process.env.APPDATA
      ? path.join(process.env.APPDATA, "Claude", "config.json")
      : null
  ].filter(Boolean);

  return candidates.find(fs.existsSync) ?? null;
}
```

Validation rule:

```js
const accountUuid = config?.oauthAccount?.accountUuid;
const userId = config?.userID;
```

Use `accountUuid` for write-target logic. Use `userID` only as non-mutating fallback if the goal is identification rather than buddy mutation.

## Common Pitfalls

- Confusing `settings.json` with account state
- Assuming `%APPDATA%\Claude\config.json` is always canonical on Windows
- Assuming `.config.json` inside `~/.claude/` is current default
- Writing to `userID` instead of `oauthAccount.accountUuid`
- Depending on undocumented schema without fallback and validation

## Final Recommendation

For `cb-zoo`, the most defensible path strategy now is:

- canonical target: `%USERPROFILE%\.claude.json`
- support `CLAUDE_CONFIG_DIR/.claude.json`
- keep `%APPDATA%\Claude\config.json` and legacy `.config.json` as fallback detection only
- emit warning that this touches internal Claude Code state

## References

- Anthropic settings docs: https://docs.anthropic.com/en/docs/claude-code/settings
- Anthropic IAM docs: https://docs.anthropic.com/en/docs/claude-code/iam
- Anthropic issue #10972: https://github.com/anthropics/claude-code/issues/10972
- Anthropic issue #1455: https://github.com/anthropics/claude-code/issues/1455
- `grayashh/buddy-reroll`: https://github.com/grayashh/buddy-reroll
- `icefort-ai/config`: https://github.com/icefort-ai/config
- `docker/mcp-gateway`: https://github.com/docker/mcp-gateway
- `ssut` account switcher gist: https://gist.github.com/ssut/7c1c3f6c64ae3da21720be69ff0ff187

## Unresolved Questions

- Anthropic still does not publish a stable public schema for `.claude.json`, so future release churn remains possible.
