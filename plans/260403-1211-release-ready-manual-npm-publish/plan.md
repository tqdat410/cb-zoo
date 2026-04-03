---
title: "Release readiness for manual npm publish"
description: "Prepare cb-zoo for a safe manual npm release with package hygiene, built-in verification, CI, and release docs."
status: completed
priority: P1
effort: 6h
branch: main
tags: [release, npm, ci, qa, docs]
blockedBy: []
blocks: []
created: 2026-04-03
---

# Release readiness for manual npm publish

## Overview

- Goal: make `cb-zoo` release-ready for manual `npm publish`, not automate publish itself.
- Constraint: keep zero-dependency runtime and avoid adding heavy tooling that does not buy real safety.
- Mode: pragmatic release hardening around package metadata, built-in checks, CI, and docs.
- Progress: 4/4 phases complete.
- Validation: local `npm run release:check` passes. Tester and reviewer cleared.

## Phases

- `completed` [Phase 1](./phase-01-harden-package-metadata-and-release-contract.md) - tightened package metadata, repo hygiene, lockfile, and publish surface.
- `completed` [Phase 2](./phase-02-add-local-release-verification-and-smoke-coverage.md) - added `check`, `smoke`, `release:verify`, `release:check`, and release-readiness smoke/tests.
- `completed` [Phase 3](./phase-03-add-github-actions-ci-for-release-gates.md) - added cross-platform CI plus canonical release-check lanes without publish automation.
- `completed` [Phase 4](./phase-04-write-manual-release-runbook-and-sync-docs.md) - added the manual release runbook and synced README, roadmap, changelog, and PDR.

## Dependencies

- Completed in order: Phase 1 -> Phase 2 -> Phase 3 -> Phase 4.
- CI and docs now mirror the final package metadata and release command names.

## Success Criteria

- Repo has a single documented local command to prove release readiness.
- CI runs the same core gates as local release checks.
- `npm pack --dry-run` succeeds with intended contents and metadata.
- Manual release steps are documented, short, and repeatable.
- No new runtime dependencies are introduced.

## Risks

- Over-engineering the pipeline with lint/build tools that add noise but little value for this zero-dependency CLI.
- CI flakiness if interactive terminal behavior is tested in a brittle way.
- Packaging drift if docs and workflow commands diverge.

## Notes

- Manual npm publish remains out of scope for this plan.
- Provenance or automated publish can be a later plan after this release.
