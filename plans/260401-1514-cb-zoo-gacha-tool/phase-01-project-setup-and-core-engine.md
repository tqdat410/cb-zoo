# Phase 1: Project Setup & Core Engine

## Context Links
- [Brainstorm Report](../reports/brainstorm-260401-1514-cb-zoo-gacha-tool.md) — algorithm details, constants, reference code

## Overview
- **Priority:** High (foundation for all other phases)
- **Status:** Complete
- **Effort:** 1.5h
- Setup npm package structure and implement the deterministic buddy generation engine (FNV-1a hash + mulberry32 PRNG + trait rolling).

## Key Insights
- Algorithm must exactly match Claude Code internals: `hash(uuid + "friend-2026-401")` → mulberry32 seed → traits
- FNV-1a (not Bun.hash) is Node.js compatible and validated by claude-petpet as fallback
- Trait generation order matters: rarity → species → eyes → hat → shiny → stats (sequential PRNG calls)

## Requirements

### Functional
- `package.json` with `bin` entry, ESM (`"type": "module"`)
- FNV-1a hash producing identical output to `Bun.hash` for buddy strings
- mulberry32 PRNG with constant `0x6d2b79f5`
- `rollFrom(uuid)` returning complete buddy object (rarity, species, eye, hat, shiny, stats)
- Weighted rarity: common:60, uncommon:25, rare:10, epic:4, legendary:1

### Non-Functional
- Zero dependencies
- Node.js >= 18

## Related Code Files

| Action | File | Description |
|--------|------|-------------|
| Create | `package.json` | npm package config, bin entry |
| Create | `src/buddy-engine.js` | Hash, PRNG, trait generation |
| Create | `src/config.js` | Constants (salt, species, rarities, etc.) |

## Implementation Steps

### 1. Create `package.json`
```json
{
  "name": "cb-zoo",
  "version": "0.1.0",
  "description": "Claude Buddy Gacha — roll, collect, and apply buddies for Claude Code",
  "type": "module",
  "bin": { "cb-zoo": "./src/cli.js" },
  "engines": { "node": ">=18" },
  "files": ["src/"],
  "keywords": ["claude", "buddy", "gacha", "cli"],
  "license": "MIT"
}
```

### 2. Create `src/config.js`
All constants in one file:
- `SALT = "friend-2026-401"`
- `SPECIES` array (18 items)
- `RARITIES` array (5 items)
- `RARITY_WEIGHTS` object
- `RARITY_FLOOR` object
- `EYES` array (6 items)
- `HATS` array (8 items)
- `STAT_NAMES` array (5 items: DEBUGGING, PATIENCE, CHAOS, WISDOM, SNARK)
- `STARS` object (rarity → star string)

### 3. Create `src/buddy-engine.js`
Functions to implement:
- `hashString(s)` — FNV-1a: init `2166136261`, XOR each char, `Math.imul(h, 16777619)`, `>>> 0`
- `mulberry32(seed)` — returns `() => number` (0-1 range)
- `pick(rng, arr)` — `arr[Math.floor(rng() * arr.length)]`
- `rollRarity(rng)` — weighted selection using `RARITY_WEIGHTS`
- `rollStats(rng, rarity)` — peak/dump stats with `RARITY_FLOOR`
- `rollFrom(uuid)` — seed = `hashString(uuid + SALT)`, returns full buddy object

**Buddy object shape:**
```javascript
{ uuid, rarity, species, eye, hat, shiny, stats, peak, dump, total }
```

### 4. Verify algorithm correctness
- Generate a buddy from a known UUID
- Compare output against claude-petpet or buddy-reroll for same UUID
- If mismatch, debug hash function output

## Todo List
- [x] Create `package.json`
- [x] Create `src/config.js` with all constants
- [x] Implement `src/buddy-engine.js` (hash + PRNG + trait gen)
- [x] Test: verify buddy output matches reference tools for known UUID

## Success Criteria
- `rollFrom(uuid)` produces deterministic, correct buddy for any UUID
- Output matches claude-petpet for same UUID + salt
- Zero dependencies, ESM, runs on Node 18+

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| FNV-1a output differs from Bun.hash | Buddy mismatch | Test with known UUIDs from reference tools |
| Salt changes in Claude update | All rolls invalid | Salt is single constant, easy update |

## Next Steps
→ Phase 2: UUID Manager & Config (reads credentials, manages UUID replacement)
