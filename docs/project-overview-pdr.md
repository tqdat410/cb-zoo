# Project Overview PDR

## Product

`cb-zoo` is a zero-dependency Node.js terminal app that rolls Claude Code buddies from random UUIDs, presents them through a Pokemon handheld-style TUI or explicit plain CLI flows, stores a local collection, and optionally applies the rolled UUID back into Claude Code.

## Goals

- Match the public buddy-generation algorithm used by `claude-petpet`
- Stay cross-platform on Windows, macOS, and Linux
- Keep installation friction low by avoiding external dependencies
- Protect the user's original Claude UUID with backup and restore commands

## Functional Requirements

- Roll a deterministic buddy from any UUID
- Launch a default interactive TUI for TTY runs
- Back up the current Claude UUID before first modification
- Apply a new UUID into the resolved Claude account state file, preferring `~/.claude.json` or `$CLAUDE_CONFIG_DIR/.claude.json`
- Update the current stored companion `name` and `personality` without changing UUID-derived bones
- Restore the original UUID from `~/.cb-zoo/backup.json`
- Save every roll to `~/.cb-zoo/collection.json`
- Reject malformed UUID values and invalid Claude config shapes before config writes
- Reject companion metadata edits when Claude state has no valid stored companion yet or when trimmed edit values are blank
- Reject invalid backup data before backup, apply, or restore continues
- Reject invalid collection data before roll mode creates backups, reveals buddies, or writes local state
- Reject pre-existing temporary write paths instead of following them during config or collection writes
- Render each buddy as a stable 5-line ASCII sprite
- Support `--plain`, `--quick`, `--collection`, `--current`, `--set-name`, `--set-personality`, `--backup`, `--restore`, and `--help`

## Non-Functional Requirements

- Node.js 18+
- ESM only
- Zero npm dependencies
- No token or config leakage in logs
- Restore terminal cursor/state cleanly after TUI exit or failure
- Atomic JSON writes for config and collection files
- BOM-tolerant JSON parsing for persisted state files
- Fail closed on corrupt backup or collection data
- Prevent cb-zoo state files from being redirected into protected Claude state directories such as `.claude` or Windows `%APPDATA%\\Claude` through env overrides

## Risks

- Claude Code may change the salt or config schema
- Claude Code does not document `.claude.json` as a stable public API
- Re-auth inside Claude Code may overwrite a rerolled UUID
- Terminal ANSI support varies across shells

## Validation

- Node built-in tests pass with `npm test`
- CLI help and collection views run without Claude config access
- UUID backup/apply/restore flow preserves unrelated config fields and tolerates a UTF-8 BOM in Claude config
- Quick roll rejects corrupt backup or collection files before backup, reveal, or local mutation
- Sprite rendering keeps a 5-line contract for stable card layout
