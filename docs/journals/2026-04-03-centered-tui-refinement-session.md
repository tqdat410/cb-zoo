# Centered TUI Refinement Closed Cleanly

**Date**: 2026-04-03 09:33
**Severity**: Medium
**Component**: TUI shell, view layout, docs/tests
**Status**: Resolved

## What Happened

Completed the centered-TUI refinement pass for `cb-zoo`. The shell now centers on wide terminals, view content uses shared frame metrics instead of ad hoc widths, and the last borrowed `Pokemon`/`handheld` wording was replaced with product-specific `cb-zoo` copy. README and core docs were synced to match the runtime behavior.

## The Brutal Truth

Most of this was cleanup, but review exposed one real defect late: the shell looked fixed on wide terminals while some inner views could still spill past the edge on narrow terminals. That would have been a stupid regression to ship after spending the session standardizing layout rules.

## Technical Details

The narrow-terminal issue surfaced during review of the roll and edit screens. They were still relying on fixed centering and wrapping assumptions, so 64-column terminals could overflow even though the outer shell was normalized. The fix was to route terminal metrics through the render path, use shared `innerWidth` values from `render-layout.js`, center content blocks against that width, and wrap edit fields against the actual available space. A regression test now asserts that minimum-width roll and edit screens stay inside terminal bounds.

Docs/test sync landed in the same pass:
- Updated `README.md`, roadmap, changelog, PDR, and architecture docs to describe the centered `cb-zoo` shell and archive wording
- `npm test`: 71 passed, 0 failed
- `npm run test:coverage`: passed, 85.49% line coverage

## What We Tried

- Added shared screen metrics and left padding in the layout renderer
- Replaced the drifting home banner with a helper-built framed block
- Normalized roll/edit rendering to width-aware centering and wrapping
- Refreshed archive/status/action copy and updated assertions/docs in the same change set

## Root Cause Analysis

The original TUI grew view-by-view. Outer chrome had one width policy, but inner screens kept their own constants. Centering the shell without forcing views onto the same contract left a hidden overflow path.

## Lessons Learned

Visual cleanup is not done until minimum-width cases are tested. Shared layout contracts only matter if every view actually consumes them. Copy refresh and test/doc updates should stay in the same pass or the repo immediately starts lying.

## Next Steps

Keep the centered shell contract as the only layout source of truth. If new screens or larger cards are added, add narrow-width regression coverage first instead of trusting the shell chrome to save them.
