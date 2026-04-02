# Phase 3: Sprites & Gacha Animation

## Context Links
- [Phase 1](./phase-01-project-setup-and-core-engine.md) — buddy-engine provides roll data
- [Brainstorm Report](../reports/brainstorm-260401-1514-cb-zoo-gacha-tool.md) — animation tiers, rarity effects

## Overview
- **Priority:** Medium
- **Status:** Complete
- **Effort:** 2h
- ASCII art sprites for all 18 species + 8 hats, and terminal gacha animation engine with rarity-based visual effects plus ANSI-safe fallback behavior.

## Key Insights
- ASCII art from claude-petpet: 5 lines tall, 12 chars wide, `{E}` placeholder for eyes
- Hat rendered on line 0 (top row) when applicable
- Animation uses raw ANSI escape codes — no dependencies
- Windows Terminal (Win10+) supports ANSI; fallback for older terminals
- Key animation: rapid species cycling → rarity color burst → buddy reveal

## Requirements

### Functional
- 18 species ASCII sprites with eye placeholder
- 8 hat overlays
- `renderSprite(species, eye, hat)` and `renderSprite(buddy)` → multiline string
- Gacha animation: spin → rarity reveal → buddy reveal
- Rarity-specific color/effect tiers (common=gray → legendary=gold)
- Shiny overlay (rainbow text cycling)
- `--quick` mode: skip animation, instant reveal

### Non-Functional
- ANSI color support detection (`process.stdout.hasColors()`, `FORCE_COLOR`, `NO_COLOR`)
- Graceful fallback: no-color mode if terminal lacks support
- Animation framerate ~15fps (66ms intervals)
- Total animation duration: ~2-3 seconds

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Create | `src/sprites.js` | ASCII bodies, hats, renderSprite() |
| Create | `src/gacha-animation.js` | Terminal animation engine |

## Architecture

```
sprites.js
├── BODIES         → { species: string[5] }  (18 species)
├── HAT_LINES      → { hat: string }         (8 hats)
├── renderSpriteLines() → (buddy | species, eye, hat) → string[5]
└── renderSprite() → (buddy | species, eye, hat) → string

gacha-animation.js
├── ANSI colors/effects constants
├── supportsAnsi()        → honors FORCE_COLOR / NO_COLOR / TTY support
├── animateGacha(buddy)     → full animation sequence
├── quickReveal(buddy)      → instant display (--quick)
├── showBuddyCard(buddy)    → formatted buddy info card
└── internal helpers:
    ├── spinPhase()          → rapid species cycling
    ├── rarityReveal()       → color burst based on rarity
    └── buddyReveal()        → final sprite + stats display
```

### Animation Sequence
```
Frame 1-15 (1s): Spin Phase
  - Cycle through random species silhouettes rapidly
  - Each frame shows different species ASCII art
  - Speed: fast→slow (decelerate)

Frame 16-20 (0.5s): Rarity Reveal
  - Screen clears
  - Rarity name appears with color burst
  - ⬜ Common (gray) | 🟩 Uncommon (green) | 🟦 Rare (cyan)
  - 🟪 Epic (magenta, ★ border) | 🟨 Legendary (yellow, ✦ border)

Frame 21-25 (0.5s): Buddy Reveal
  - ASCII sprite fades in
  - Stats display below
  - Shiny: rainbow color cycling on sprite text
```

### ANSI Color Map
```javascript
const RARITY_COLORS = {
  common:    '\x1b[90m',   // gray
  uncommon:  '\x1b[32m',   // green
  rare:      '\x1b[36m',   // cyan
  epic:      '\x1b[35m',   // magenta
  legendary: '\x1b[33m',   // yellow/gold
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
```

## Implementation Steps

### 1. Create `src/sprites.js`

Port ASCII art from claude-petpet reference:
- `BODIES` object: 18 species, each 5-line array, `{E}` for eye slot
- `HAT_LINES` object: 8 hat strings
- `renderSprite(species, eye, hat)`:
  1. Clone body lines
  2. Replace `{E}` with eye char
  3. If hat !== "none" and line[0] is blank, replace with hat line
  4. Join with `\n`

### 2. Create `src/gacha-animation.js`

**Terminal control helpers:**
- `clearScreen()` — `\x1b[2J\x1b[H`
- `moveCursor(row, col)` — `\x1b[${row};${col}H`
- `hideCursor()` / `showCursor()` — `\x1b[?25l` / `\x1b[?25h`
- `sleep(ms)` — `new Promise(r => setTimeout(r, ms))`

**`animateGacha(buddy)`:**
1. Hide cursor
2. Run `spinPhase()`: 15 frames, decelerating interval (40ms→120ms)
   - Each frame: clear + render random species sprite in DIM color
3. Run `rarityReveal(buddy.rarity)`: flash rarity name + color border
   - Common: simple text
   - Legendary: full border with ✦ characters
4. Run `buddyReveal(buddy)`: render final sprite + stats card
   - If shiny: cycle rainbow colors on sprite lines
5. Show cursor
6. Return (let CLI handle apply/reroll prompt)

**`quickReveal(buddy)`:**
- Skip animation, directly call `showBuddyCard(buddy)`

**`showBuddyCard(buddy)`:**
```
╔══════════════════════════════════╗
║  ★★★ RARE — Dragon             ║
║                                  ║
║     ASCII SPRITE HERE            ║
║                                  ║
║  Eyes: ✦  Hat: crown  ✨ Shiny  ║
║                                  ║
║  DEBUGGING ████████░░  82       ║
║  PATIENCE  ██████░░░░  61       ║
║  CHAOS     ███░░░░░░░  28       ║
║  WISDOM    ███████░░░  72       ║
║  SNARK     █████░░░░░  55       ║
║                                  ║
║  Total: 298                      ║
╚══════════════════════════════════╝
```

### 3. Stats bar rendering
- `renderStatBar(value)`: `█` × Math.floor(value/10), `░` × (10 - filled)
- Colorize bar based on stat value: red(<30), yellow(30-60), green(>60)

## Todo List
- [x] Create `src/sprites.js` — all 18 species + 8 hats + renderSprite()
- [x] Create `src/gacha-animation.js` — ANSI helpers
- [x] Implement `spinPhase()` — rapid species cycling
- [x] Implement `rarityReveal()` — color burst per rarity
- [x] Implement `buddyReveal()` — final sprite + stats card
- [x] Implement `showBuddyCard()` — formatted display
- [x] Implement `quickReveal()` — instant mode
- [x] Test: sprite overlay/no-hat rendering and ANSI env fallback covered by automated smoke checks; extra manual terminal spot-check remains a pre-publish nice-to-have

## Success Criteria
- All 18 species render correctly with eye/hat variants
- Gacha animation runs smoothly (~15fps) for 2-3 seconds
- Each rarity tier has distinct visual effect
- Shiny buddies have rainbow cycling
- `--quick` mode skips animation entirely
- Degrades to plain-text output when ANSI is unavailable or explicitly disabled
- Automated coverage verifies sprite overlay rendering and ANSI env gating; broader terminal spot-checks still advisable before publish

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| ANSI not supported | Broken display | Detect with hasColors(), fallback to plain text |
| Windows cmd.exe issues | No colors | Use Windows Terminal recommendation in README |
| Unicode chars missing | Garbled sprites | Use ASCII-safe alternatives as fallback |

## Next Steps
→ Phase 4: Collection System & CLI
