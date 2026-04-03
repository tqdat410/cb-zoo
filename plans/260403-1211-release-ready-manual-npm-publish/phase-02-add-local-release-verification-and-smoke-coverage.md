# Phase 2 - Add local release verification and smoke coverage

## Context Links

- [package.json](../../../package.json)
- [test](../../../test)
- [src/cli.js](../../../src/cli.js)
- [docs/system-architecture.md](../../../docs/system-architecture.md)

## Overview

- Priority: P1
- Status: completed
- Purpose: create fast, repeatable local commands that prove the package is safe to publish.
- Result: local release verification now covers syntax/package-contract checks, deterministic CLI smoke flows, coverage, and `npm pack --dry-run`.

## Key Insights

- Tests already pass and coverage is good, but the repo has no single release-gate command.
- This CLI has no build step, so syntax, test, coverage, pack, and a few non-interactive smoke checks are the real gates.
- Interactive TUI behavior should be validated through targeted non-brittle checks, not screenshot-heavy automation.

## Requirements

- Reuse Node built-ins where possible.
- Avoid introducing ESLint/Prettier just to create ceremony.
- Cover the highest-risk publish paths: CLI entrypoint, help text, plain mode, quick mode, and package packing.

## Architecture

- One top-level script such as `npm run release:check` should orchestrate local release gates.
- Smoke verification should live in tests or small scripts under `scripts/` so CI can run the same steps.
- Coverage should remain built around `node:test`.

## Related Code Files

- Files to modify:
  - `package.json`
- Files to create:
  - `scripts/check-release-contract.cjs`
  - `scripts/smoke-cli.cjs`
  - `test/package-release-readiness.test.js`
- Files to delete:
  - none

## Implementation Steps

1. Add a no-dependency syntax and release-contract check with `node --check` plus required-file/package assertions.
2. Add `release:verify` and `release:check` so local verification runs `check`, `npm test`, `smoke`, coverage, and `npm pack --dry-run`.
3. Add smoke checks for `--help`, `--plain --quick` with piped input, plus non-interactive `--collection` and `--current` paths.
4. Add release-readiness tests around package metadata, script wiring, shipped support files, and `.gitignore` coverage.
5. Keep all smoke coverage deterministic and non-interactive so CI can trust it.

## Todo List

- [x] Define `check`, `smoke`, `release:verify`, and `release:check` scripts
- [x] Add smoke verification script
- [x] Add package/bin release-readiness coverage
- [x] Ensure `npm run release:check` is deterministic on a clean machine

## Success Criteria

- A single local command proves release readiness.
- Smoke checks catch broken CLI routing before publish.
- `npm run release:check` passes on the maintainer machine without manual setup beyond Node/npm.

## Risk Assessment

- Risk: overfitting smoke checks to console formatting details.
- Mitigation: assert behavior and exit status, not fragile full-output snapshots.

## Security Considerations

- Smoke checks must use temp dirs and env overrides, not the maintainer's real Claude state.
- Pack verification must ensure no local secrets or state files are shipped.

## Next Steps

- Done. The final command sequence is mirrored in GitHub Actions.
