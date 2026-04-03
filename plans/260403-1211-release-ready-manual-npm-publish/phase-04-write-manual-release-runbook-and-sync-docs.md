# Phase 4 - Write manual release runbook and sync docs

## Context Links

- [README.md](../../../README.md)
- [docs/project-changelog.md](../../../docs/project-changelog.md)
- [docs/development-roadmap.md](../../../docs/development-roadmap.md)
- [docs/project-overview-pdr.md](../../../docs/project-overview-pdr.md)

## Overview

- Priority: P2
- Status: completed
- Purpose: leave a short, reliable paper trail for the exact manual release process and the new repo gates.
- Result: the manual npm runbook landed and README, roadmap, changelog, and PDR now reflect the release gates and manual-publish stance.

## Key Insights

- The roadmap already says publish metadata and release workflow are still missing.
- Manual publish tonight needs a crisp runbook more than a long design doc.
- Docs must reflect that CI verifies readiness but does not publish.

## Requirements

- Keep the release instructions short enough to follow under time pressure.
- Sync README, roadmap, and changelog with the actual implemented release gates.
- Make manual publish prerequisites explicit.

## Architecture

- Evergreen docs hold the durable release instructions.
- Changelog and roadmap record that the release-readiness work landed.
- README points to the canonical local verification command and package install usage.

## Related Code Files

- Files to modify:
  - `README.md`
  - `docs/project-changelog.md`
  - `docs/development-roadmap.md`
  - `docs/project-overview-pdr.md`
- Files to create:
  - `docs/deployment-guide.md`
- Files to delete:
  - none

## Implementation Steps

1. Create a concise manual release runbook in `docs/deployment-guide.md`.
2. Document preflight requirements and commands: clean git tree, green CI, `npm ci`, `npm run release:check`, and `npm whoami`.
3. Document the manual publish sequence plus immediate `npm view` post-publish checks.
4. Update README to point maintainers at the runbook and release-check command.
5. Mark roadmap/changelog/PDR entries so release-readiness work is visible.

## Todo List

- [x] Add manual release runbook
- [x] Sync README references
- [x] Update roadmap status and next work
- [x] Update changelog and PDR

## Success Criteria

- A maintainer can publish manually from docs without guessing steps.
- Docs match actual script names and CI behavior.
- Release-readiness work is traceable in roadmap and changelog.

## Risk Assessment

- Risk: docs drift from scripts after late changes.
- Mitigation: write Phase 4 last and derive docs from the final commands.

## Security Considerations

- Runbook must never suggest committing tokens or storing them in repo files.
- Manual publish steps should mention token/account verification without echoing secrets.

## Next Steps

- After the manual release ships, consider a follow-up plan for automated publish and provenance.
