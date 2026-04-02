# Brainstorm Report: cb-zoo — Claude Buddy Gacha Tool

**Date:** 2026-04-01
**Status:** Approved → Plan creation

## Problem Statement

Existing Claude Code buddy reroll tools (buddy-reroll, claude-buddy-reroll, claude-petpet) are Unix-only, require Bun runtime, and lack engaging gacha UX. Need a lightweight, cross-OS Node.js tool with terminal gacha animation and collection tracking.

## Evaluated Approaches

### 1. UUID Brute-force (Selected)
- Generate random UUIDs, hash with salt, check resulting traits
- Replace UUID in `~/.claude/.config.json` → `oauthAccount.accountUuid`
- **Pros:** Simple, cross-OS, no binary patching, safe
- **Cons:** Slower for targeted searches (mitigated by parallel generation)

### 2. Salt Brute-force (Rejected)
- Keep real UUID, find salt producing desired traits, patch binary
- **Pros:** Keeps real account identity
- **Cons:** Binary patching fragile, breaks on updates, not cross-OS

### 3. Hybrid (Rejected)
- Unnecessary complexity, violates KISS

## Final Design: cb-zoo

### Tech Stack
- **Runtime:** Node.js (zero additional deps)
- **Language:** JavaScript (ESM)
- **Distribution:** npm package (`npx cb-zoo`)
- **Dependencies:** ZERO — pure Node.js stdlib

### Algorithm (reverse-engineered from Claude Code)
```
UUID + SALT("friend-2026-401") → FNV-1a hash → mulberry32 PRNG seed
→ Rarity (weighted: 60/25/10/4/1)
→ Species (18 types)
→ Eyes (6 types)
→ Hat (8 types, common=none)
→ Shiny (1% chance)
→ Stats (5 stats: DEBUGGING, PATIENCE, CHAOS, WISDOM, SNARK)
```

### Architecture
```
cb-zoo/
├── package.json
├── src/
│   ├── cli.js              # Entry, arg parsing, main loop
│   ├── buddy-engine.js     # FNV-1a + mulberry32 + trait gen
│   ├── gacha-animation.js  # Terminal animation engine
│   ├── uuid-manager.js     # UUID read/write/backup/restore
│   ├── collection.js       # Pokédex storage & display
│   ├── sprites.js          # ASCII art per species
│   └── config.js           # OS paths, constants
└── README.md
```

### Features
1. **Gacha Random Roll** — Terminal animation with rarity-based effects
2. **Collection/Pokédex** — Track all rolled buddies, completion progress
3. **Backup/Restore** — Safety net for UUID changes
4. **Current Buddy** — Show current buddy info

### Gacha Animation Tiers
| Rarity | Color | Effect |
|--------|-------|--------|
| Common | Gray | Simple reveal |
| Uncommon | Green | Gentle pulse |
| Rare | Cyan | Color wave |
| Epic | Magenta | Stars + shake |
| Legendary | Gold | Rainbow border + sparkles |
| Shiny | Rainbow | Extra overlay |

### CLI Commands
```bash
npx cb-zoo              # Gacha roll
npx cb-zoo --quick      # No animation
npx cb-zoo --collection # Pokédex
npx cb-zoo --current    # Current buddy
npx cb-zoo --backup     # Backup UUID
npx cb-zoo --restore    # Restore UUID
```

### Cross-OS Paths
- Credentials: `~/.claude/.credentials.json` (all OS)
- Config: `~/.claude/.config.json` (all OS, `~` = `%USERPROFILE%` on Windows)
- Collection: `~/.cb-zoo/collection.json`

### Risks
| Risk | Mitigation |
|------|------------|
| Salt changes | Single constant update |
| Hash mismatch | FNV-1a validated by claude-petpet |
| Re-auth overwrites | Backup system + user warning |
| Windows ANSI | Fallback simple mode |

## Key Reference Code

### FNV-1a Hash (Node.js compatible)
```javascript
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
```

### Mulberry32 PRNG
```javascript
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

### Trait Constants
- **Species:** duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk
- **Rarity weights:** common:60, uncommon:25, rare:10, epic:4, legendary:1
- **Rarity floors:** common:5, uncommon:15, rare:25, epic:35, legendary:50
- **Eyes:** ·, ✦, ×, ◉, @, °
- **Hats:** none, crown, tophat, propeller, halo, wizard, beanie, tinyduck
- **Stats:** DEBUGGING, PATIENCE, CHAOS, WISDOM, SNARK
- **Salt:** "friend-2026-401"

## Next Steps
→ Create detailed implementation plan with phases
