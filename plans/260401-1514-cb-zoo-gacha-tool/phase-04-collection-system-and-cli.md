# Phase 4: Collection System & CLI

## Context Links
- [Phase 1](./phase-01-project-setup-and-core-engine.md) — buddy-engine for rolling
- [Phase 2](./phase-02-uuid-manager-and-config.md) — uuid-manager for apply/backup
- [Phase 3](./phase-03-sprites-and-gacha-animation.md) — animation for display

## Overview
- **Priority:** Medium
- **Status:** Complete
- **Effort:** 1.5h
- Pokédex collection tracking and main CLI entry point tying all modules together, with fail-fast guards for corrupt local state and non-interactive roll misuse.

## Key Insights
- Collection stored as JSON array of rolled buddies at `~/.cb-zoo/collection.json`
- Track every rolled buddy (not just applied ones) — the gacha experience is the rolling
- Pokédex grid: show completion by species × rarity (18 × 5 = 90 combos + shinies)
- CLI is the glue — parse args, orchestrate engine → animation → uuid → collection
- Roll mode must prove prompt input exists before taking a backup or writing collection data
- Corrupt backup/collection files should block mutation, not get silently overwritten

## Requirements

### Functional
- Save every rolled buddy to collection (auto-save on roll)
- Display collection grid showing discovered species × rarity combos
- Show completion stats (total rolled, unique combos, shiny count)
- CLI arg parsing: `--quick`, `--collection`, `--current`, `--backup`, `--restore`, `--help`
- Unknown flags fail fast through strict arg parsing
- Main gacha loop: roll → animate → prompt (Apply / Reroll / Quit)
- Reject non-interactive roll mode when stdin input is unavailable
- Shebang line for `npx` execution

### Non-Functional
- Collection file grows unbounded — keep entries minimal (no full stats, just key traits)
- Interactive prompt uses raw `readline` (no deps)
- Collection writes are atomic temp-file swaps
- Corrupt backup/collection state must stop the flow before local files are mutated

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Create | `src/collection.js` | Load, save, display collection/Pokédex |
| Create | `src/cli.js` | Entry point, arg parsing, main loop |

## Architecture

```
collection.js
├── loadCollection()        → read/validate collection.json → []
├── saveToCollection(buddy) → append buddy to file
├── displayCollection()     → render Pokédex grid
└── getStats()              → { total, unique, shinies, legendaries }

cli.js (entry point)
├── #!/usr/bin/env node
├── parseArgs(argv)
├── main()
│   ├── --help        → showHelp()
│   ├── --collection  → displayCollection()
│   ├── --current     → showCurrentBuddy()
│   ├── --backup      → backupUuid()
│   ├── --restore     → restoreUuid()
│   └── (default)     → gachaLoop(isQuick)
└── gachaLoop(isQuick)
    ├── ensurePromptInputAvailable()
    ├── validate/create backup before first roll
    ├── roll buddy via rollFrom(randomUUID)
    ├── animate or quickReveal
    ├── save to collection
    └── prompt: [A]pply / [R]eroll / [Q]uit
```

### Collection Entry Shape (minimal)
```javascript
{
  uuid: "...",
  species: "dragon",
  rarity: "rare",
  eye: "✦",
  hat: "crown",
  shiny: false,
  total: 298,
  rolledAt: "2026-04-01T15:14:00Z"
}
```

### Pokédex Display
```
╔═══════════════════════════════════════════════════╗
║  🎮 CB-ZOO COLLECTION                [15/90]     ║
╠═══════════════════════════════════════════════════╣
║ Species    C   U   R   E   L   ✨                ║
║ duck       ✓   ✓   ·   ·   ·   ·                ║
║ goose      ✓   ·   ·   ·   ·   ·                ║
║ blob       ✓   ✓   ✓   ·   ·   ·                ║
║ cat        ·   ·   ·   ·   ·   ·                ║
║ dragon     ✓   ·   ✓   ·   ·   ·                ║
║ ...                                               ║
╠═══════════════════════════════════════════════════╣
║ Total Rolls: 42  │  Unique: 15/90  │  ✨ Shiny: 1 ║
║ ★★★★★ Legendary: 0  │  Rarest: Epic Dragon       ║
╚═══════════════════════════════════════════════════╝
```

## Implementation Steps

### 1. Create `src/collection.js`

**`loadCollection()`**
1. Check if `COLLECTION_FILE` exists
2. If yes: read JSON text and strip UTF-8 BOM if present
3. Parse JSON into an array
4. Reject non-array/corrupt content with a descriptive error
5. If no file: return `[]`

**`saveToCollection(buddy)`**
1. Read and validate existing collection before mutating
2. Load existing collection
3. Push new entry with `rolledAt: new Date().toISOString()`
4. Write back through temp-file rename

**`displayCollection()`**
1. Load collection
2. Build species × rarity presence map
3. Render grid with `✓` for discovered, `·` for missing
4. Show summary stats at bottom

**`getStats()`**
1. Count total entries
2. Count unique `species+rarity` combos
3. Count shiny entries
4. Find rarest buddy (highest rarity tier)

### 2. Create `src/cli.js`

**Shebang + imports:**
```javascript
#!/usr/bin/env node
import { parseArgs } from 'node:util';
```

**`parseArgs` config:**
```javascript
const { values } = parseArgs({
  options: {
    quick:      { type: 'boolean', short: 'q', default: false },
    collection: { type: 'boolean', short: 'c', default: false },
    current:    { type: 'boolean', default: false },
    backup:     { type: 'boolean', short: 'b', default: false },
    restore:    { type: 'boolean', short: 'r', default: false },
    help:       { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
});
```

**`gachaLoop(isQuick)`**
1. Fail fast if scripted stdin is unavailable
2. Validate or create backup before first roll
3. Loop:
   a. Generate `crypto.randomUUID()`
   b. `rollFrom(uuid)` → buddy
   c. If quick: `quickReveal(buddy)` else `animateGacha(buddy)`
   d. `saveToCollection(buddy)`
   e. Prompt: `[A]pply  [R]eroll  [Q]uit`
   f. If Apply: `applyUuid(buddy.uuid)`, print success, exit
   g. If Reroll: continue loop
   h. If Quit: exit

**Interactive prompt (no deps):**
```javascript
import { createInterface } from 'node:readline';
function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer); });
  });
}
```

**`showCurrentBuddy()`**
1. `getCurrentUuid()` from uuid-manager
2. `rollFrom(uuid)` to compute buddy
3. `showBuddyCard(buddy)`

**`showHelp()`**
```
cb-zoo — Claude Buddy Gacha 🎰

Usage: cb-zoo [options]

Options:
  (none)         Gacha roll with animation
  -q, --quick    Roll without animation
  -c, --collection  View your Pokédex
  --current      Show current buddy
  -b, --backup   Backup current UUID
  -r, --restore  Restore backed-up UUID
  -h, --help     Show this help
```

## Todo List
- [x] Create `src/collection.js` — load, save, display, stats
- [x] Create `src/cli.js` — entry point with shebang
- [x] Implement arg parsing with `node:util` parseArgs
- [x] Implement `gachaLoop()` — roll → animate → prompt → apply
- [x] Implement `showCurrentBuddy()` — display current
- [x] Implement `showHelp()` — usage info
- [x] Test: local automated flow covers roll → save → collection view → apply → restore in temp directories, plus corrupt backup/collection and closed-stdin guards
- [x] Test: `npx .` works from project root

## Success Criteria
- `npx cb-zoo` launches gacha roll with animation
- `npx cb-zoo --quick` rolls instantly
- `npx cb-zoo --collection` shows Pokédex grid
- `npx cb-zoo --current` shows current buddy
- `npx cb-zoo --backup` / `--restore` works correctly
- Collection persists across sessions
- Interactive prompt accepts a/r/q input
- Invalid backup/collection data fails fast before config or collection mutation
- Non-interactive roll mode with no stdin fails before backup, prompt, or collection writes

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| readline blocking on Windows | Stuck prompt | Test on Windows, use raw mode if needed |
| Collection file corruption | Roll blocked until user fixes file | Validate on read, refuse overwrite, write through temp-file rename |
| Large collection file | Slow load | Minimal entry shape keeps file small |

## Next Steps
→ End-to-end testing, README, npm publish preparation
