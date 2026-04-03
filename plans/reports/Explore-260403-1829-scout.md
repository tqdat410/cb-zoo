# CB-Zoo Scout Report

## 1. BUDDY TYPES

### Species (18 total)
src/config.js (7-26): duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk

### Eyes (6)
src/config.js (27): · ✦ × ◉ @ °

### Hats (8)
src/config.js (28): none, crown, tophat, propeller, halo, wizard, beanie, tinyduck

### Rarities (5)
src/config.js (6, 30-50): common(60%), uncommon(25%), rare(10%), epic(4%), legendary(1%)

### Stats (5)
src/config.js (29): DEBUGGING, PATIENCE, CHAOS, WISDOM, SNARK
Each buddy: peak stat (55-100) + dump stat (1-25) + 3 floor-based (variance 40)

### Shiny
1% chance from UUID hash, boolean flag

---

## 2. TRAIT GENERATION (Deterministic)

### rollFrom(uuid)
src/buddy-engine.js (59-69) returns:
  uuid, rarity, species, eye, hat, shiny, stats, peak, dump, total

Chain: hashString(uuid + SALT) -> wyhash -> mulberry32 -> pick/rollRarity/rollStats
SALT = 'friend-2026-401' (critical for backward compat)

Test case confirms determinism:
  UUID 123e4567-e89b-12d3-a456-426614174000 -> turtle, common, eye=◉, hat=none, total=155

---

## 3. ASCII RENDERING

### Sprites
src/sprites.js: 18 species × 5-line bodies with {E} eye placeholders

### Hats
HAT_LINES: 8 overlay templates (line 0 replacement)

Functions: renderSpriteLines(), renderSprite()

---

## 4. COLLECTION SYSTEM

### File: ~/.cb-zoo/collection.json
src/collection.js: JSON array of entries

Schema: uuid, species, rarity, eye, hat, shiny, total, rolledAt

Validation: isCollectionEntry() (11-26)

Operations: loadCollection, saveToCollection, deleteCollectionEntry, getStats, formatCollection

Max size: configurable (default 50)

Uniqueness: species:rarity pairs (max 90 combos)

---

## 5. DATA STORAGE

### Claude State (~/.claude.json)
src/claude-state.js: oauthAccount.accountUuid (MUTATED on reroll), companion fields (PRESERVED)

### Settings (~/.cb-zoo/settings.json)
src/settings-manager.js: backup, maxBuddy, pendingBuddy

### Companion Integration
src/companion-state.js: Merges stored companion + UUID traits + session intro into summary card

---

## 6. CODE STRUCTURE

Core: config, buddy-engine, wyhash, sprites, collection, settings-manager, claude-state, companion-state, uuid-manager, cli, gacha-animation

TUI: app, render-helpers, render-layout, views, controller, state

---

## 7. KEY INSIGHTS

- UUID = source of truth for traits (always regenerated)
- Collection entries = snapshots (store total, can recalc stats from uuid)
- Common always has none hat (forced)
- SALT constant = backward compat anchor
- Uniqueness = species:rarity only (not eyes/hats/shiny)

---

## 8. FILE PATHS

Species/Eyes/Hats/Rarities: src/config.js (6-29, 30-50)
Buddy engine: src/buddy-engine.js (1-69)
ASCII: src/sprites.js (1-52)
Collection: src/collection.js (11-162)
Settings: src/settings-manager.js (104-173)
Claude state: src/claude-state.js (25-125)
Companion: src/companion-state.js (99-151)
Arch doc: docs/system-architecture.md
Tests: test/buddy-engine.test.js (10-29), test/integration-flows.test.js (312-350)

---

## UNRESOLVED

1. Planned expansions to species/eyes/hats/stats?
2. wyhash algorithm frozen intentionally?
3. Store individual stats in collection or regenerate?
4. Companion intro detection rules beyond timestamp?
5. Long-term SALT versioning strategy?
