# Phase 2: UUID Manager & Config

## Context Links
- [Phase 1](./phase-01-project-setup-and-core-engine.md) — depends on buddy-engine.js, config.js
- [Brainstorm Report](../reports/brainstorm-260401-1514-cb-zoo-gacha-tool.md) — cross-OS paths

## Overview
- **Priority:** High
- **Status:** Complete
- **Effort:** 1h
- Read current account UUID from Claude Code config, backup/restore UUID, and apply new UUID after gacha roll with BOM-tolerant JSON parsing and invalid-backup protection.

## Key Insights
- UUID stored in `~/.claude/.config.json` at `oauthAccount.accountUuid`
- Windows: `%USERPROFILE%\.claude\.config.json`
- macOS/Linux: `~/.claude/.config.json`
- Re-authenticating Claude Code overwrites UUID back to real one → backup is critical
- Electron app also has an `ant-did` file, but this CLI only reads/writes `oauthAccount.accountUuid` in `.config.json`
- cb-zoo data stored at `~/.cb-zoo/` (separate from Claude config)

## Requirements

### Functional
- Detect OS and resolve correct paths
- Read current UUID from `.config.json`
- Backup current UUID before first modification
- Apply new UUID to `.config.json`
- Restore backed-up UUID
- Warn user about re-auth overwrite risk

### Non-Functional
- Graceful errors if config file missing or malformed
- Tolerate UTF-8 BOM in Claude config JSON
- Never corrupt existing config (read → modify → atomic temp-file replace)
- Never proceed with a corrupt backup file
- Cross-OS path resolution

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Create | `src/uuid-manager.js` | UUID CRUD: read, apply, backup, restore |
| Modify | `src/config.js` | Add OS path resolution functions |

## Architecture

```
uuid-manager.js
├── getCurrentUuid()      → reads .config.json → returns uuid string
├── applyUuid(newUuid)    → writes uuid to .config.json
├── backupUuid()          → saves current uuid to ~/.cb-zoo/backup.json
├── restoreUuid()         → reads validated backup, applies to .config.json
├── hasBackup()           → validates existing backup before roll flow
└── ensureDataDir()       → creates ~/.cb-zoo/ path when needed
```

JSON reads strip a leading UTF-8 BOM. JSON writes go through `file.tmp` then `rename` to avoid partial writes.

### Config Path Resolution (add to config.js)
```javascript
import { homedir } from 'node:os';
import { join } from 'node:path';

const CLAUDE_DIR = join(homedir(), '.claude');
const CONFIG_FILE = join(CLAUDE_DIR, '.config.json');
const CBZOO_DIR = join(homedir(), '.cb-zoo');
const BACKUP_FILE = join(CBZOO_DIR, 'backup.json');
const COLLECTION_FILE = join(CBZOO_DIR, 'collection.json');
```

## Implementation Steps

### 1. Add path constants to `src/config.js`
- `CLAUDE_DIR`, `CONFIG_FILE`, `CBZOO_DIR`, `BACKUP_FILE`, `COLLECTION_FILE`
- Use `node:os` `homedir()` + `node:path` `join()` — works cross-OS

### 2. Implement `src/uuid-manager.js`

**`getCurrentUuid()`**
1. Read `CONFIG_FILE`, stripping UTF-8 BOM if present
2. Parse JSON
3. Return `data.oauthAccount.accountUuid`
4. Throw descriptive error if file missing or key absent

**`applyUuid(newUuid)`**
1. Read full config JSON
2. Set `data.oauthAccount.accountUuid = newUuid`
3. Write back through temp-file rename with `JSON.stringify(data, null, 2)`
4. Print warning: "Restart Claude Code to see your new buddy"

**`backupUuid()`**
1. `mkdir -p` CBZOO_DIR
2. If backup exists: validate it and reuse it
3. If backup exists but is invalid: fail hard, do not touch Claude config
4. Otherwise read current UUID
5. Write `{ uuid, backedUpAt }` to BACKUP_FILE via temp-file rename

**`restoreUuid()`**
1. Read BACKUP_FILE
2. Validate stored UUID before use
3. Apply stored UUID via `applyUuid()`
4. Print success message with restored UUID

**`hasBackup()`**
1. Return `false` when backup file is absent
2. Validate existing backup before roll flow starts
3. Throw descriptive error if backup exists but is corrupt

## Todo List
- [x] Add path constants to `src/config.js`
- [x] Implement `getCurrentUuid()` — read from .config.json
- [x] Implement `backupUuid()` — save to ~/.cb-zoo/backup.json
- [x] Implement `applyUuid(newUuid)` — write to .config.json
- [x] Implement `restoreUuid()` — read backup and apply
- [x] Test: backup → apply new → restore, preserve surrounding config JSON, tolerate UTF-8 BOM, reject corrupt backup reuse

## Success Criteria
- Can read UUID from Claude Code config on Windows/macOS/Linux
- Backup preserves original UUID before any modification
- Apply correctly updates only the UUID field, preserves rest of config
- Restore returns to original UUID
- UTF-8 BOM in Claude config does not block reads
- Corrupt backup data blocks roll/apply flow before config mutation

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Config file doesn't exist | Crash | Check existence, show "Run Claude Code first" message |
| Config format changes | Write fails | Read-modify-write pattern, don't assume structure beyond oauthAccount |
| Backup overwritten or half-written | Lost original UUID | Only create backup once, validate existing backup before reuse, write through temp-file rename |

## Security Considerations
- Never log or display the full access token from credentials
- Don't expose config file contents in error messages
- Backup file contains only UUID (not sensitive)

## Next Steps
→ Phase 3: Sprites & Gacha Animation
