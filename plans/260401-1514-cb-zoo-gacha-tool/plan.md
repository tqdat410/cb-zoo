---
title: "cb-zoo: Claude Buddy Gacha Tool"
description: "Cross-OS Node.js CLI for gacha rolling Claude Code buddies with safety-hardened backup, collection, and terminal reveal flows"
status: completed
priority: P2
effort: 6h
issue:
branch:
tags: [cli, tool, nodejs, gacha]
blockedBy: []
blocks: []
created: 2026-04-01
---

# cb-zoo: Claude Buddy Gacha Tool

## Overview

Zero-dependency Node.js CLI tool for gacha-rolling Claude Code buddies. Uses FNV-1a + mulberry32 PRNG (matching Claude Code internals) to generate buddies from random UUIDs. Ships terminal gacha animation, Pokédex-style collection tracking, BOM-tolerant JSON reads, validated backup/collection guards, and cross-OS backup/apply/restore flow. Distributable via `npx cb-zoo`.

## Brainstorm Reference

- [Brainstorm Report](../reports/brainstorm-260401-1514-cb-zoo-gacha-tool.md)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Project Setup & Core Engine](./phase-01-project-setup-and-core-engine.md) | Complete |
| 2 | [UUID Manager & Config](./phase-02-uuid-manager-and-config.md) | Complete |
| 3 | [Sprites & Gacha Animation](./phase-03-sprites-and-gacha-animation.md) | Complete |
| 4 | [Collection System & CLI](./phase-04-collection-system-and-cli.md) | Complete |

## Dependencies

- Node.js >= 18 (for `crypto.randomUUID()`)
- No npm dependencies

## Completion Notes

- Safety fixes synced into implementation: UTF-8 BOM-safe JSON parsing, atomic JSON writes via temp-file rename, backup validation before reuse, collection corruption fail-fast behavior, and roll-loop guards for missing stdin.
- Automated coverage now exercises sprite overlay rendering, ANSI env fallback, backup/apply/restore, corrupt backup/collection protection, and non-interactive safety paths.
