# Phase 1: Define CLI edit flow and companion-state guards

## Context Links

- [Plan overview](./plan.md)
- [README](../../README.md)
- [Code standards](../../docs/code-standards.md)
- [System architecture](../../docs/system-architecture.md)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 1h
- Lock the user-facing edit UX and fail-closed rules before changing any write path.

## Key Insights

- The current CLI is flat flag-based argument parsing; adding explicit string flags is the smallest change
- `src/claude-state.js` already knows how to validate/read the resolved Claude state and extract `companion`
- `src/uuid-manager.js` already owns atomic writes and should remain the only file-writing primitive for Claude state mutations

## Requirements

### Functional

- Support editing `companion.name` and `companion.personality` independently or together in one command
- Reject edits when Claude state has no valid stored companion yet
- Trim user input and reject empty values after trimming
- Return a clear success message and updated companion summary after mutation

### Non-Functional

- Keep zero dependencies
- Preserve backward-compatible behavior for `--current`, `--backup`, `--restore`, and roll flow
- Keep CLI semantics obvious; no hidden prompts for edit mode

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/cli.js` | Add new string flags, help text, and edit command routing |
| Modify | `src/claude-state.js` | Add/extend validation helpers for editable companion metadata |
| Modify | `src/uuid-manager.js` | Reuse write path for companion metadata updates |

## Architecture

```text
cb-zoo --set-name "Milo" --set-personality "Calm but ruthless"
  -> parseArgs() reads optional string flags
  -> validate at least one edit flag is present
  -> resolveClaudeState({ requireWritableConfig: true })
  -> validate existing config.companion object and sanitized inputs
  -> mutate only companion.name / companion.personality
  -> write JSON atomically through existing writer
  -> print updated companion summary
```

## Implementation Steps

1. Finalize CLI contract
   - use `--set-name <value>`
   - use `--set-personality <value>`
   - allow both flags together
2. Define guardrails
   - require an existing valid `companion` object
   - preserve `hatchedAt`
   - reject blank strings after trimming
3. Decide output contract
   - concise success line with updated config path
   - follow with refreshed companion summary

## Todo List

- [x] Confirm edit flags and non-interactive UX
- [x] Define validation rules for blank or malformed input
- [x] Define success and error message contract

## Success Criteria

- A developer can implement the edit flow without guessing CLI semantics
- No part of the edit flow implies UUID mutation or companion re-hatching
- Failure cases are explicit and testable

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Ambiguous flag names | Users misuse the command | Prefer verb-based flags: `--set-name`, `--set-personality` |
| Creating a companion object when none exists | Diverges from Claude's real state lifecycle | Fail closed and instruct user to hatch/view a real companion first |
| Allowing empty strings | Broken current-card rendering | Trim and reject empty values |

## Security Considerations

- Never log raw config contents
- Do not loosen existing writable-config validation
- Keep writes scoped to known safe companion fields only

## Next Steps

Completed. The implemented CLI uses `--set-name` and `--set-personality`, rejects blank trimmed values, requires a valid stored companion, and prints the updated summary after a successful write.
