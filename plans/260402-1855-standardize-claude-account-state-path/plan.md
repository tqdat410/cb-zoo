---
title: "Standardize Claude account state path resolution"
description: "Align cb-zoo with current Claude Code account-state path behavior centered on .claude.json plus validated fallbacks"
status: completed
priority: P1
effort: 3h
branch: main
tags: [claude-code, config, path-resolution, safety]
created: 2026-04-02
---

# Standardize Claude account state path resolution

## Overview

Follow-up plan to replace the outdated `.claude/.config.json` assumption with a safer resolver centered on `.claude.json`, based on [research report](../reports/research-260402-claude-code-accountuuid-path-best-practice.md).

## Status Summary

- Overall status: Completed
- Phase progress: 3/3 phases complete
- Validation: `npm test` and `npm run test:coverage` passed on 2026-04-02

## Context Links

- [Research Report](../reports/research-260402-claude-code-accountuuid-path-best-practice.md)
- [Previous cb-zoo implementation plan](../260401-1514-cb-zoo-gacha-tool/plan.md)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Audit current path assumptions and target design](./phase-01-audit-current-path-assumptions-and-target-design.md) | Completed |
| 2 | [Implement resolver, UUID manager migration, and regression tests](./phase-02-implement-resolver-uuid-manager-migration-and-regression-tests.md) | Completed |
| 3 | [Refresh docs, warnings, and rollout notes](./phase-03-refresh-docs-warnings-and-rollout-notes.md) | Completed |

## Dependencies

- Existing CLI behavior must stay backward compatible where practical
- Research assumptions remain subject to future Claude Code internal schema changes

## Success Criteria

- `cb-zoo` reads and writes account UUID through a centralized resolver
- Canonical path becomes `~/.claude.json` or `CLAUDE_CONFIG_DIR/.claude.json`
- Legacy/community paths remain fallback-only and are clearly documented as such
- Regression tests cover resolver ordering, missing files, and fallback behavior
- User-facing docs stop claiming `.claude/.config.json` as canonical

## Risks

- Claude Code internal file schema may change again
- Legacy users may rely on `%APPDATA%\Claude\config.json` or `.config.json`
- Over-eager migration can break current working setups if fallback ordering is wrong

## Implementation Notes

- Keep changes tight: `src/config.js`, `src/uuid-manager.js`, tests, and docs only
- Do not broaden scope into unrelated CLI refactors
- Prefer read-only compatibility for legacy fields like `userID`; keep writes restricted to `oauthAccount.accountUuid`
