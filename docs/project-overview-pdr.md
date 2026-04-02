# Project Overview PDR

## Product

`cb-zoo` is a zero-dependency Node.js CLI that rolls Claude Code buddies from random UUIDs, previews them with a terminal gacha reveal, stores a local collection, and optionally applies the rolled UUID back into Claude Code.

## Goals

- Match the public buddy-generation algorithm used by `claude-petpet`
- Stay cross-platform on Windows, macOS, and Linux
- Keep installation friction low by avoiding external dependencies
- Protect the user's original Claude UUID with backup and restore commands

## Functional Requirements

- Roll a deterministic buddy from any UUID
- Back up the current Claude UUID before first modification
- Apply a new UUID into `~/.claude/.config.json`
- Restore the original UUID from `~/.cb-zoo/backup.json`
- Save every roll to `~/.cb-zoo/collection.json`
- Reject malformed UUID values and invalid Claude config shapes before config writes
- Reject invalid backup data before backup, apply, or restore continues
- Reject invalid collection data before roll mode creates backups, reveals buddies, or writes local state
- Reject pre-existing temporary write paths instead of following them during config or collection writes
- Render each buddy as a stable 5-line ASCII sprite
- Support `--quick`, `--collection`, `--current`, `--backup`, `--restore`, and `--help`

## Non-Functional Requirements

- Node.js 18+
- ESM only
- Zero npm dependencies
- No token or config leakage in logs
- Atomic JSON writes for config and collection files
- BOM-tolerant JSON parsing for persisted state files
- Fail closed on corrupt backup or collection data
- Prevent cb-zoo state files from being redirected into `.claude` through env overrides

## Risks

- Claude Code may change the salt or config schema
- Re-auth inside Claude Code may overwrite a rerolled UUID
- Terminal ANSI support varies across shells

## Validation

- Node built-in tests pass with `npm test`
- CLI help and collection views run without Claude config access
- UUID backup/apply/restore flow preserves unrelated config fields and tolerates a UTF-8 BOM in Claude config
- Quick roll rejects corrupt backup or collection files before backup, reveal, or local mutation
- Sprite rendering keeps a 5-line contract for stable card layout
