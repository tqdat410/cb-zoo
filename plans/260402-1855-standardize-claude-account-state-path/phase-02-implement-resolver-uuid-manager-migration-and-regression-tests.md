# Phase 2: Implement resolver, UUID manager migration, and regression tests

## Context Links

- [Phase 1](./phase-01-audit-current-path-assumptions-and-target-design.md)
- [Research Report](../reports/research-260402-claude-code-accountuuid-path-best-practice.md)
- [System architecture](../../docs/system-architecture.md)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 2h
- Move runtime behavior to the new path-resolution model and lock it with tests.

## Key Insights

- `src/config.js` is already the right home for path helpers
- `src/uuid-manager.js` already has good safety primitives: BOM stripping, atomic writes, UUID validation
- Main risk is mutating the wrong file due to weak resolver ordering

## Requirements

### Functional

- Add centralized Claude state file resolver
- Return both canonical candidate path and resolved existing path
- Update UUID manager to read/write through resolver
- Keep backup and restore behavior unchanged from a user perspective
- Add tests for `.claude.json` primary path and fallback layouts

### Non-Functional

- Maintain zero dependencies
- Preserve fail-closed handling on malformed JSON or invalid UUIDs
- Keep changes localized and small

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/config.js` | Introduce resolver candidate ordering and helper exports |
| Modify | `src/uuid-manager.js` | Swap direct config path usage for resolved Claude state file |
| Modify | `test/integration-flows.test.js` | Add path-order and fallback regression tests |
| Optional modify | `test/buddy-engine.test.js` | Only if shared helper coverage is needed |

## Architecture

```text
uuid-manager.js
  -> resolveClaudeStateFile()
     -> CLAUDE_CONFIG_DIR/.claude.json
     -> ~/.claude.json
     -> CLAUDE_CONFIG_DIR/.config.json
     -> %APPDATA%/Claude/config.json (Windows only)
  -> read JSON with BOM tolerance
  -> validate oauthAccount.accountUuid
  -> write back atomically to the resolved file only
```

## Implementation Steps

1. Add helper(s) in `src/config.js`
   - candidate list builder
   - resolved existing file finder
   - maybe `getPreferredClaudeStateFile()` and `resolveClaudeStateFile()`
2. Update `src/uuid-manager.js`
   - replace `getConfigFile()` read/write assumptions
   - keep backup and apply API stable
   - improve error messages so users know which file was selected
3. Extend tests
   - `.claude.json` primary path
   - `CLAUDE_CONFIG_DIR/.claude.json`
   - legacy `.config.json` fallback
   - Windows `%APPDATA%\\Claude\\config.json` fallback when primary missing
   - invalid fallback file shape should fail closed
4. Run `npm test` and `npm run test:coverage`

## Todo List

- [x] Add centralized Claude state file resolver in `src/config.js`
- [x] Update UUID manager to use resolved state file
- [x] Preserve current backup/apply/restore behavior and messages where possible
- [x] Add regression tests for resolver ordering and fallback behavior
- [x] Run full test suite and coverage script

## Success Criteria

- Runtime no longer assumes `.claude/.config.json` as default
- `.claude.json` path works on current machine layout
- Fallback layouts still work when primary path is absent
- Tests catch future accidental regression in resolver order

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Wrong fallback selected first | Corrupts wrong state file | Deterministic candidate order + tests |
| Existing user env overrides break | Runtime failure | Respect `CLAUDE_CONFIG_DIR`, keep legacy fallback |
| Hidden schema variation in old files | Read/apply failure | Validate JSON shape before mutation |

## Security Considerations

- Continue to write only `oauthAccount.accountUuid`
- Never copy unrelated account data into backup files
- Keep file-path details in errors, but never dump file contents

## Next Steps

Completed. Resolver, UUID-manager migration, and regression coverage landed.
