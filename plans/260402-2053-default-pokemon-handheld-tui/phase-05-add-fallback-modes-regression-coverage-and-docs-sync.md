# Phase 5: Add fallback modes, regression coverage, and docs sync

## Context Links

- [Plan overview](./plan.md)
- [README](../../README.md)
- [Code standards](../../docs/code-standards.md)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 2h
- Make the new default mode safe to ship by protecting non-TTY behavior, adding targeted tests, and syncing docs.

## Key Insights

- The current test suite is strong on domain logic but weak on interactive rendering contracts
- Full terminal snapshots would be expensive and brittle; test boundaries should stay pragmatic
- Docs must explicitly explain default TUI behavior and fallback plain mode

## Requirements

### Functional

- Preserve non-TTY roll safety and current scriptable use cases
- Add regression tests for TTY routing and fallback routing
- Document default TUI mode, fallback behavior, and key controls

### Non-Functional

- Keep tests deterministic
- Avoid brittle pixel/screen snapshot tests unless narrowly scoped
- Update roadmap/changelog/system docs to match the shipped model

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `test/integration-flows.test.js` | Add routing/fallback regression coverage |
| Create or modify | `test/tui-*.test.js` | Add focused TUI rendering or state-machine tests |
| Modify | `README.md` | Document default TUI and plain fallback |
| Modify | `docs/system-architecture.md` | Document TUI layer |
| Modify | `docs/project-overview-pdr.md` | Update functional requirements |
| Modify | `docs/development-roadmap.md` | Record progress |
| Modify | `docs/project-changelog.md` | Record the feature |
| Modify | `.env.example` | Only if new env-tunable UI behavior is introduced |

## Architecture

```text
tests
  -> domain tests stay
  -> TUI routing tests add
  -> focused render/state tests add

docs
  -> default mode = TUI
  -> fallback mode documented
```

## Implementation Steps

1. Add TTY/non-TTY routing tests
2. Add focused state-machine/render helper tests
3. Validate backup/apply/edit flows still pass through existing domain tests
4. Update docs and examples
5. Run full validation:
   - `npm test`
   - `npm run test:coverage`

## Todo List

- [x] Add default-vs-fallback mode coverage
- [x] Add focused TUI helper/state tests
- [x] Update README and docs for new default mode
- [x] Run full test and coverage validation

## Success Criteria

- The new TUI ships without breaking pipes, tests, or automation
- Docs make the new behavior obvious
- Validation covers the highest-risk routing and lifecycle edges

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Terminal snapshot tests become brittle | Maintenance drag | Test helpers/state/routing more than full screen dumps |
| Non-TTY path regresses quietly | Breaks automation | Add explicit routing tests |
| Docs lag behind the default-mode change | User confusion | Sync docs in the same delivery phase |

## Security Considerations

- TUI introduction must not weaken current write-path validation or backup safeguards
- Error handling must restore terminal state before surfacing failures

## Next Steps

Completed. The migration ships with routing coverage, focused TUI helper/controller tests, updated docs, and passing `npm test` plus `npm run test:coverage`.
