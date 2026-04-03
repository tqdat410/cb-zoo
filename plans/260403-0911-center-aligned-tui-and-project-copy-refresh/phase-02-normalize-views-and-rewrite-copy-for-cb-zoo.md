# Phase 2: Normalize views and rewrite copy for cb-zoo

## Context Links

- [Phase 1](./phase-01-define-centered-shell-geometry-and-shared-frame-rules.md)
- [Home view](../../src/tui/views/home-view.js)
- [Roll view](../../src/tui/views/roll-view.js)
- [Current view](../../src/tui/views/current-view.js)
- [Collection view](../../src/tui/views/collection-view.js)
- [Edit view](../../src/tui/views/edit-view.js)

## Overview

- **Priority:** High
- **Status:** Completed
- **Effort:** 2h
- Bring every TUI screen onto the same visual rules, remove crooked nested frames, and replace generic borrowed wording with cb-zoo-specific language.

## Key Insights

- The home banner is currently hand-drawn with a fixed-width inner frame that visibly misaligns at runtime
- Roll view still hardcodes centering width `50`, which means the shell can be centered while reveal content still feels off
- Several user-facing strings still say `Pokemon`, `Pokedex`, or `handheld`, including docs and tests

## Requirements

### Functional

- Replace or rebuild any inner framed banner that can drift against the shared shell
- Normalize reveal-stage centering to the shared content width
- Rewrite titles, subtitles, status lines, and helper text to reflect cb-zoo and Claude buddy collection language
- Remove Pokemon-derived wording from TUI views and any directly related plain terminal copy

### Non-Functional

- Keep wording short enough for the bounded shell width
- Avoid introducing a new view framework or component layer
- Preserve existing navigation and action semantics

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/tui/views/home-view.js` | Replace the broken hero box and update home copy |
| Modify | `src/tui/views/roll-view.js` | Stop using hardcoded inner centering widths and refresh reveal copy |
| Modify | `src/tui/views/current-view.js` | Update subtitles/status text to product-specific wording |
| Modify | `src/tui/views/collection-view.js` | Rename shelf/detail copy and keep list/detail alignment clean |
| Modify | `src/tui/views/edit-view.js` | Refresh editor copy to match product voice |
| Modify | `src/tui/controller.js` | Refresh home-to-archive status copy to match the new vocabulary |
| Modify | `src/tui/roll-flow.js` | Refresh roll and archive status messages to match the new vocabulary |
| Modify | `test/tui-renderers.test.js` | Update renderer expectations for the new copy and frame behavior |

## Architecture

```text
shared shell contract
  -> view title/subtitle/status
  -> optional inner text block or helper-made box
  -> action hints
  -> product-specific copy
```

## Implementation Steps

1. Replace the home hero box with a layout-safe text block or helper-generated box
2. Pass shared content-width assumptions through render logic instead of hardcoding `50`
3. Rewrite screen copy around cb-zoo concepts: lab, archive, roster, current buddy, collection
4. Search project-local TUI strings for borrowed branding and update matching assertions

## Todo List

- [x] Remove the misaligned inner banner from the home screen
- [x] Normalize roll-stage centering against shared width rules
- [x] Refresh all TUI view titles, subtitles, footers, and statuses
- [x] Remove remaining Pokemon-derived wording from source and tests in scope

## Success Criteria

- The home screen no longer shows the right-edge border drift visible in the current screenshot
- Revealed roll content looks centered relative to the shell, not to an arbitrary width
- TUI copy reads as original cb-zoo product language

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Overwriting too much copy | Tone drift | Keep changes limited to visible TUI/product wording |
| Inconsistent text width | Wrapping issues | Prefer short labels and reuse `wrapText` where needed |
| Hidden borrowed strings | Incomplete cleanup | Use repo-wide search for `Pokemon`, `Pokedex`, `handheld` during implementation |

## Security Considerations

- Copy and layout cleanup must not alter persistence, UUID mutation, or validation logic
- Any helper refactor must preserve current keyboard-only behavior and failure messaging

## Next Steps

Completed. Home, roll, archive, current, and edit flows now share the centered shell contract and project-specific cb-zoo copy.
