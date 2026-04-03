# Phase 1: Define centered shell geometry and shared frame rules

## Context Links

- [Plan overview](./plan.md)
- [Current layout renderer](../../src/tui/render-layout.js)
- [Render helpers](../../src/tui/render-helpers.js)
- [Layout tests](../../test/tui-layout.test.js)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 1.5h
- Establish one geometry contract for shell width, horizontal centering, inner padding, and safe body height before touching view copy.

## Key Insights

- The current shell clamps width but never adds left padding, so wide terminals still feel left-anchored
- Several views center content against ad hoc widths like `50`, which fights the outer shell contract
- The visual glitch in the home banner is a frame-within-frame problem, not just a wording problem

## Requirements

### Functional

- Center the shell horizontally inside the terminal canvas
- Keep a bounded shell width so the UI still feels like a device, not a dashboard
- Expose or infer a stable content width that inner views can honor consistently
- Preserve clipping and footer/status behavior

### Non-Functional

- Keep render logic dependency-free and mostly pure
- Avoid fragile ANSI width math regressions
- Keep vertical positioning simple; no aggressive full-screen centering

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/tui/app.js` | Pass live terminal metrics into view rendering |
| Modify | `src/tui/render-layout.js` | Add terminal-aware left padding and shared geometry contract |
| Modify | `src/tui/render-helpers.js` | Add any small helpers needed for visible-width-safe alignment |
| Modify | `src/tui/state.js` | Pass terminal-aware layout context into views |
| Modify | `test/tui-layout.test.js` | Add centered-shell regression coverage |

## Architecture

```text
terminal size
  -> shell width policy
  -> left padding
  -> inner content width
  -> body/footer clipping
  -> full-screen redraw
```

## Implementation Steps

1. Define width policy for narrow, normal, and wide terminals
2. Compute left padding from terminal columns and shell width
3. Keep top-origin render flow; do not vertically center the whole app
4. Expose a consistent inner width contract for downstream views
5. Add tests for centered output and width fallback behavior

## Todo List

- [x] Decide final width thresholds for centered shell behavior
- [x] Implement left padding in the shared layout renderer
- [x] Normalize helper behavior for ANSI-safe centering and padding
- [x] Cover centered layout with focused tests

## Success Criteria

- Wide terminals show visible left padding before the shell border
- Narrow terminals still render safely without negative padding or wrapped borders
- Layout tests validate geometry without brittle full-screen snapshots

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| ANSI visible width mismatch | Crooked spacing | Reuse existing `stripAnsi`-based helpers |
| Too-wide shell cap | Loses handheld feel | Keep a conservative max width |
| Terminal resize edge cases | Partial redraw artifacts | Keep redraw logic full-frame and stateless |

## Security Considerations

- Layout work must not change backup/apply/edit flows or hide domain errors
- Render math must fail safe and never produce unbounded string growth from invalid terminal sizes

## Next Steps

Completed. The shell now centers horizontally, uses a tighter width cap, and exposes shared geometry that views can use for stable alignment.
