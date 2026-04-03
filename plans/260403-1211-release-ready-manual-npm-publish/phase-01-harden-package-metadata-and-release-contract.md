# Phase 1 - Harden package metadata and release contract

## Context Links

- [README.md](../../../README.md)
- [package.json](../../../package.json)
- [docs/code-standards.md](../../../docs/code-standards.md)
- [docs/development-roadmap.md](../../../docs/development-roadmap.md)

## Overview

- Priority: P1
- Status: completed
- Purpose: define the package surface that will ship to npm and close obvious hygiene gaps before CI is added.
- Result: `package.json` metadata, `.gitignore`, `LICENSE`, `package-lock.json`, release-facing script names, and README package notes are in place.

## Key Insights

- The package already packs cleanly with `files`, but metadata is still minimal.
- The repo has no `.gitignore`, no lockfile, and no release-specific command contract yet.
- Zero runtime dependencies means we should prefer metadata hygiene and built-in checks over adding lint stacks.

## Requirements

- Keep runtime zero-dependency.
- Ensure package metadata is complete enough for public npm consumption.
- Make publish intent explicit without automating `npm publish`.
- Keep packed contents narrow and predictable.

## Architecture

- `package.json` becomes the release contract source of truth.
- Repo hygiene files protect local state and keep future publish/CI runs deterministic.
- Metadata and command names chosen here become inputs for later CI and docs phases.

## Related Code Files

- Files to modify:
  - `package.json`
  - `README.md`
- Files to create:
  - `.gitignore`
  - `LICENSE`
  - `package-lock.json`
- Files to delete:
  - none

## Implementation Steps

1. Add missing public package metadata such as `repository`, `homepage`, `bugs`, and `publishConfig.access`.
2. Define the release command surface in `package.json` with `check`, `smoke`, `release:verify`, and `release:check`.
3. Create `.gitignore` rules for Node artifacts, local cb-zoo state, npm auth, and env files while keeping `.env.example`.
4. Generate and commit a lockfile so `npm ci` and future audit steps have a stable base.
5. Add an MIT `LICENSE` file so the published package is legally explicit, not just metadata-declared.
6. Refresh README install and package sections where the package contract changed.

## Todo List

- [x] Complete public npm metadata in `package.json`
- [x] Add release-facing scripts in `package.json`
- [x] Create `.gitignore`
- [x] Commit `package-lock.json`
- [x] Add `LICENSE`
- [x] Sync README package/install notes

## Success Criteria

- `npm pack --dry-run` still succeeds.
- Package metadata is sufficient for npm package page and issue/repo links.
- Git ignores obvious local and generated junk.
- Lockfile exists and `npm ci` is viable.

## Risk Assessment

- Risk: adding too many scripts before deciding actual verification behavior.
- Mitigation: only add script names that Phase 2 will immediately implement.

## Security Considerations

- Ensure `.env`, local data files, and temp output are excluded from git.
- Do not widen the `files` list beyond necessary publish contents.

## Next Steps

- Done. Final script names fed into Phase 2 and CI job commands in Phase 3.
