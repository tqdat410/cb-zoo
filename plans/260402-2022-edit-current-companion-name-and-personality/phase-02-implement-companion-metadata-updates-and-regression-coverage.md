# Phase 2: Implement companion metadata updates and regression coverage

## Context Links

- [Phase 1](./phase-01-define-cli-edit-flow-and-companion-state-guards.md)
- [Plan overview](./plan.md)
- [Code standards](../../docs/code-standards.md)
- [System architecture](../../docs/system-architecture.md)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 2h
- Add the real write path and lock it with regression coverage.

## Key Insights

- `src/uuid-manager.js` already has `writeJsonFile()` and resolved-state loading; companion edits should reuse that logic
- `src/companion-state.js` already formats the post-edit output, so the CLI can confirm success with existing rendering
- `test/integration-flows.test.js` is already 643 lines, so new edit-flow coverage may justify a separate focused test file

## Requirements

### Functional

- Mutate only provided companion fields
- Preserve `oauthAccount.accountUuid`, `companion.hatchedAt`, and unrelated config fields
- Keep `applyUuid()` and `restoreUuid()` behavior unchanged
- Show updated companion card after successful edit

### Non-Functional

- Keep code direct and dependency-free
- Maintain atomic writes and fail-closed parsing
- Keep edited files under control; split new test coverage if it improves clarity

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/cli.js` | Dispatch edit command and print result |
| Modify | `src/claude-state.js` | Add helper(s) to validate editable companion payload/state |
| Modify | `src/uuid-manager.js` | Add companion metadata update function built on existing atomic write path |
| Modify or create | `test/integration-flows.test.js` or `test/companion-editing.test.js` | Cover successful edits and fail-closed cases |
| Modify | `test/companion-state.test.js` | Only if summary output needs direct regression coverage |

## Architecture

```text
updateCompanionMetadata({ name?, personality? })
  -> resolveClaudeState({ requireWritableConfig: true })
  -> assert config.companion is a valid editable object
  -> sanitize provided fields
  -> apply only provided values
  -> writeJsonFile(configFile, config)
  -> return { configFile, companion }
```

## Implementation Steps

1. Add an update function in `src/uuid-manager.js`
   - accept partial companion metadata
   - validate companion existence and field payload
   - reuse `writeJsonFile()`
2. Extend CLI parsing in `src/cli.js`
   - add string options
   - route edit command before roll mode
   - print updated summary via `formatCompanionSummary(getCurrentCompanion())` or returned data
3. Add regression tests
   - edit name only
   - edit personality only
   - edit both fields together
   - reject missing companion object
   - reject blank trimmed values
   - prove UUID and unrelated config fields stay unchanged
4. Run verification
   - `npm test`
   - `npm run test:coverage`

## Todo List

- [x] Implement companion metadata update path on top of atomic JSON writes
- [x] Wire new edit flags into CLI flow
- [x] Add focused regression coverage for success and failure cases
- [x] Run test and coverage scripts

## Success Criteria

- Edit commands work against the resolved Claude state file only
- Regression tests prove metadata edits do not mutate UUID or clear companion cache
- Full test suite stays green

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Reusing wrong helper mutates UUID path unexpectedly | High | Isolate new updater from `applyUuid()` behavior |
| Tests only cover happy path | Medium | Add explicit fail-closed fixtures and unchanged-field assertions |
| CLI parsing order conflicts with existing flags | Medium | Add branch ordering tests and keep edit flow early/explicit |

## Security Considerations

- Continue to reject malformed JSON or invalid writable config containers
- Never allow edit flow to create arbitrary nested config properties
- Keep updated-path messages free of config content

## Next Steps

Completed. Runtime uses the existing resolved-state write path, coverage includes malformed stored `hatchedAt` tolerance, and `npm test` plus `npm run test:coverage` passed.
