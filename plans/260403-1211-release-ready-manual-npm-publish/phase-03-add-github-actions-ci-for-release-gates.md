# Phase 3 - Add GitHub Actions CI for release gates

## Context Links

- [package.json](../../../package.json)
- [README.md](../../../README.md)
- [docs/development-roadmap.md](../../../docs/development-roadmap.md)

## Overview

- Priority: P1
- Status: completed
- Purpose: move the release checks into CI so the repo proves release health before manual publish.
- Result: GitHub Actions now runs cross-platform `npm test` and `npm run smoke`, plus a canonical `npm run release:check` lane on Ubuntu and Windows.

## Key Insights

- The repo currently has no `.github/workflows` directory.
- This package claims cross-platform behavior, so at least one Windows CI lane is justified.
- Coverage does not need to run on every matrix cell; keep the workflow fast and signal-heavy.

## Requirements

- CI must be reproducible with `npm ci`.
- CI must run the same core checks as local release verification.
- Workflow must stay simple enough to debug quickly before tonight's manual publish.

## Architecture

- One primary `ci.yml` workflow on push and pull_request.
- Matrix job for core tests across supported Node/OS combinations.
- One focused packaging job for coverage plus `npm pack --dry-run`.

## Related Code Files

- Files to modify:
  - `README.md`
  - `docs/project-changelog.md`
  - `docs/development-roadmap.md`
- Files to create:
  - `.github/workflows/ci.yml`
- Files to delete:
  - none

## Implementation Steps

1. Add a workflow triggered on `push`, `pull_request`, and optional `workflow_dispatch`.
2. Run a lean matrix across `ubuntu-latest` Node 18/22 plus `windows-latest` Node 22.
3. Use `npm ci` once the lockfile exists.
4. Run `npm test` and `npm run smoke` on the matrix, and run `npm run release:check` on the release-check job.
5. Fail the workflow on packaging or smoke-test regressions.
6. Keep npm publish automation out of scope for this workflow.

## Todo List

- [x] Create `ci.yml`
- [x] Define OS and Node matrix
- [x] Add canonical release-check job
- [x] Keep workflow manual-publish-ready but non-publishing
- [x] Sync docs that mention release gates

## Success Criteria

- PRs and pushes automatically validate release health.
- Windows path-sensitive behavior gets at least one real CI lane.
- CI does not attempt to publish.

## Risk Assessment

- Risk: matrix too wide for the value it adds.
- Mitigation: keep one small matrix and one canonical packaging lane.

## Security Considerations

- Do not inject npm publish tokens into CI yet.
- Keep workflow permissions minimal since publish is manual.

## Next Steps

- Done. The workflow and pass criteria are referenced in the release runbook and synced docs.
