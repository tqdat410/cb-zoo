# Code Standards

## Runtime

- Node.js 18 or newer
- Native ESM modules
- Zero npm dependencies

## Implementation Rules

- Keep code direct and small. Prefer stdlib over abstractions.
- Keep code files under 200 lines where practical.
- Use synchronous filesystem access for short CLI operations when it reduces complexity.
- Use atomic temp-file writes before replacing JSON files.
- Treat on-disk JSON as untrusted input: strip an optional UTF-8 BOM, validate required shape, and fail closed on corrupt state files.
- Avoid mocking the main runtime behavior in production code.

## Project Conventions

- Source lives in `src/`
- Tests live in `test/`
- Docs live in `docs/`
- Config constants and path helpers live in `src/config.js`
- Deterministic buddy logic lives in `src/buddy-engine.js`
- Terminal presentation logic should stay in `src/tui/` or `src/gacha-animation.js`, not mixed into domain modules

## Testing

- Use Node's built-in `node:test`
- Keep the release gate in npm scripts: `check`, `smoke`, `release:verify`, and `release:check`
- Keep `prepublishOnly` wired to `npm run release:verify` so manual publishes cannot skip verification
- Add regression coverage for deterministic roll outputs
- Lock sprite rendering to its 5-line output contract
- Exercise filesystem flows through temp directories and env overrides, including invalid backup and collection fixtures
- Prefer focused tests for TUI routing, render helpers, and state transitions over brittle full-screen snapshots

## Safety

- Never log full Claude config contents
- Only update `oauthAccount.accountUuid` and the current stored `companion.name` / `companion.personality`
- Accept an optional UTF-8 BOM when reading persisted JSON files
- Reject malformed UUIDs and invalid Claude config container shapes before writing config
- Reject companion metadata edits when Claude state has no valid stored companion or when trimmed edit values are empty
- Reject invalid backup or collection files before mutating config or local state
- Validate collection state before roll mode creates backups or reveals new buddies
- Refuse writes when the temporary `*.tmp` path already exists instead of following hostile or stale temp files
- Keep cb-zoo state outside protected Claude state directories, including `.claude` and Windows `%APPDATA%\\Claude`, even when env overrides are supplied
- Always keep backup and collection storage outside protected Claude state directories
- Keep rendered sprites at 5 lines so CLI card layout stays stable
- Always restore cursor and terminal screen state when the TUI exits or errors
