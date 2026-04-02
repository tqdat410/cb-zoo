---
title: "Allow editing current companion name and personality"
description: "Add CLI support to update stored Claude companion metadata without changing UUID-derived bones."
status: completed
priority: P2
effort: 4h
branch: main
tags: [cli, companion, metadata, claude-code]
blockedBy: []
blocks: []
created: 2026-04-02
---

# Allow editing current companion name and personality

## Overview

Add a focused CLI flow that lets users update the stored Claude companion `name` and `personality` fields in the resolved account-state file without changing `oauthAccount.accountUuid` or clearing the existing companion cache.

## Status Summary

- Overall status: Completed
- Phase progress: 3/3 phases complete
- Validation: `npm test` and `npm run test:coverage` passed on 2026-04-02
- Existing plan dependencies: none; prior related plans are already completed

## Context Links

- [README](../../README.md)
- [Project overview PDR](../../docs/project-overview-pdr.md)
- [Code standards](../../docs/code-standards.md)
- [System architecture](../../docs/system-architecture.md)
- [Prior state-path hardening plan](../260402-1855-standardize-claude-account-state-path/plan.md)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Define CLI edit flow and companion-state guards](./phase-01-define-cli-edit-flow-and-companion-state-guards.md) | Completed |
| 2 | [Implement companion metadata updates and regression coverage](./phase-02-implement-companion-metadata-updates-and-regression-coverage.md) | Completed |
| 3 | [Refresh help text, docs, and rollout notes](./phase-03-refresh-help-text-docs-and-rollout-notes.md) | Completed |

## Dependencies

- Claude account state must already contain a valid `companion` object before edit commands are allowed
- Existing atomic JSON write and config-shape validation must remain the single write path
- CLI must stay zero-dependency and cross-platform

## Success Criteria

- Users can update companion `name` and/or `personality` from CLI flags in one command
- Updates preserve `oauthAccount.accountUuid`, `hatchedAt`, and unrelated config data
- Missing or malformed companion state fails closed with clear errors
- Regression coverage proves only intended companion fields change
- README/help/docs describe the new flow and its limits clearly

## Risks

- Writing companion metadata through the wrong code path could regress UUID safety guarantees
- Overloading existing flags could create ambiguous CLI behavior
- Terminal-facing output could become noisy or misleading if edit confirmation is unclear

## Implementation Notes

- Prefer explicit string flags such as `--set-name` and `--set-personality`; avoid interactive editor flow
- Reuse the current Claude state resolver and atomic writer instead of introducing a second persistence path
- Keep test growth under control by moving new edit-flow coverage into a focused test file if `test/integration-flows.test.js` becomes less maintainable
- Landed runtime changes in `src/cli.js`, `src/claude-state.js`, `src/uuid-manager.js`, focused coverage in `test/companion-editing.test.js`, and docs updates including `docs/code-standards.md` plus `.env.example`
