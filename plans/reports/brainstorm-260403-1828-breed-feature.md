# Brainstorm: Breed Feature

## Problem Statement

Add a "Breed" feature to cb-zoo: select 2 buddies from collection to create a new buddy offspring. Species determined by a full 153-pair breeding table, eye/hat inherited randomly from parents, rarity averaged, hatched from a timed egg.

## Agreed Design

### Core Flow

1. User selects "Breed" from home menu
2. Pick Parent A from collection
3. Pick Parent B from collection (different buddy)
4. System determines offspring traits:
   - **Species**: lookup `breedingTable[parentA.species][parentB.species]`
   - **Eye**: random pick from `[parentA.eye, parentB.eye]`
   - **Hat**: random pick from `[parentA.hat, parentB.hat]`
   - **Rarity**: `avg(parentA_tier, parentB_tier)` rounded down, 15% chance +1 tier
   - **Shiny**: standard 1% random
   - **Stats**: random (wherever UUID hash lands)
5. System creates egg with rarity-based timer
6. On hatch: brute-force hunt UUID that produces matching (species, eye, hat, rarity) via `rollFrom()`
7. Offspring added to collection; parents kept

### UUID Hunt Mechanism

Same technique as any-buddy. Generate random UUIDs, run `rollFrom(uuid)`, check if output matches desired traits. Match probability per attempt:

| Rarity Target | Est. Probability | Avg Attempts |
|--------------|-----------------|-------------|
| common (hat forced "none") | ~1/108 | ~108 |
| uncommon | ~1/2,160 | ~2,160 |
| rare | ~1/8,640 | ~8,640 |
| epic | ~1/21,600 | ~21,600 |
| legendary | ~1/86,400 | ~86,400 |

All feasible. Legendary worst case ~2-5 seconds on modern hardware.

### Egg Mechanic

| Rarity | Hatch Time | Egg Display |
|--------|-----------|-------------|
| common | 10s | white egg |
| uncommon | 30s | green egg |
| rare | 1m | blue egg |
| epic | 2m | purple egg |
| legendary | 5m | gold egg |

**Persistence**: Egg saved to `settings.json` with `{ breedEgg: { species, eye, hat, rarity, shiny, createdAt, hatchAt } }`.

**UX options**:
- Stay on hatch screen: live countdown + egg ASCII art animation
- Exit and return: egg timestamp persists, shows "egg ready!" banner on next launch

UUID hunt happens at hatch time (not at breed time) so the actual buddy UUID is resolved when the egg opens.

### Rarity Calculation

```
parentA_tier = RARITY_ORDER[parentA.rarity]  // 0-4
parentB_tier = RARITY_ORDER[parentB.rarity]  // 0-4
avgTier = Math.floor((parentA_tier + parentB_tier) / 2)
if (Math.random() < 0.15) avgTier = Math.min(4, avgTier + 1)
offspringRarity = RARITIES[avgTier]
```

Examples:
- common(0) + common(0) = common, 15% uncommon
- common(0) + rare(2) = common, 15% uncommon
- rare(2) + epic(3) = uncommon, 15% rare
- epic(3) + legendary(4) = rare, 15% epic

### Breeding Table (Full 153 Pairs)

Same species always produces same species (18 diagonal entries).

Cross-breed table — designed for thematic logic + balanced distribution (~8-9 results per species):

| # | Parent A | Parent B | Offspring | Reasoning |
|---|----------|----------|-----------|-----------|
| 1 | duck | goose | goose | similar birds, goose dominant |
| 2 | duck | blob | duck | duck survives absorption |
| 3 | duck | cat | cat | predator instinct |
| 4 | duck | dragon | dragon | power dominates |
| 5 | duck | octopus | axolotl | water creatures → cute water thing |
| 6 | duck | owl | owl | wisdom bird wins |
| 7 | duck | penguin | penguin | tuxedo water bird |
| 8 | duck | turtle | turtle | pond friends |
| 9 | duck | snail | snail | both slow, shell trait |
| 10 | duck | ghost | snail | spectral trail → slime trail |
| 11 | duck | axolotl | duck | water cute → duck cute |
| 12 | duck | capybara | duck | pond duck vibes |
| 13 | duck | cactus | owl | desert bird wisdom |
| 14 | duck | robot | duck | duck dodges mech |
| 15 | duck | rabbit | goose | speed + bird = goose charge |
| 16 | duck | mushroom | duck | pond forager |
| 17 | duck | chonk | duck | duck stays light |
| 18 | goose | blob | blob | goose rage melts into blob |
| 19 | goose | cat | goose | goose chases cat |
| 20 | goose | dragon | dragon | both aggressive |
| 21 | goose | octopus | octopus | tentacles vs wings |
| 22 | goose | owl | owl | night bird vs day bird |
| 23 | goose | penguin | penguin | formal birds |
| 24 | goose | turtle | goose | goose pecks shell |
| 25 | goose | snail | snail | goose + trail = snail |
| 26 | goose | ghost | ghost | angry spirit |
| 27 | goose | axolotl | axolotl | water cute |
| 28 | goose | capybara | capybara | both unbothered |
| 29 | goose | cactus | cactus | prickly attitude |
| 30 | goose | robot | goose | goose destroys machine |
| 31 | goose | rabbit | rabbit | chase result |
| 32 | goose | mushroom | mushroom | garden terror |
| 33 | goose | chonk | chonk | big goose energy |
| 34 | blob | cat | blob | cat absorbed |
| 35 | blob | dragon | dragon | fire evaporates blob → dragon |
| 36 | blob | octopus | blob | both squishy |
| 37 | blob | owl | owl | wisdom resists blob |
| 38 | blob | penguin | penguin | blob freezes → penguin |
| 39 | blob | turtle | turtle | shell protects |
| 40 | blob | snail | snail | slimy trail friends |
| 41 | blob | ghost | dragon | formless power unleashed |
| 42 | blob | axolotl | penguin | cold squishy combo |
| 43 | blob | capybara | goose | chaos + chill = goose attitude |
| 44 | blob | cactus | dragon | blob absorbs desert power |
| 45 | blob | robot | blob | blob corrodes circuits |
| 46 | blob | rabbit | blob | rabbit stuck in blob |
| 47 | blob | mushroom | blob | organic slime growth |
| 48 | blob | chonk | blob | mass absorbs mass |
| 49 | cat | dragon | dragon | cat + fire |
| 50 | cat | octopus | octopus | hunter meets ink |
| 51 | cat | owl | owl | night hunters |
| 52 | cat | penguin | cat | cat in tuxedo |
| 53 | cat | turtle | turtle | patience wins |
| 54 | cat | snail | cat | cat bats snail |
| 55 | cat | ghost | ghost | 9 lives spent → ghost |
| 56 | cat | axolotl | cat | cat catches water pet |
| 57 | cat | capybara | cat | cat ignores chill vibes |
| 58 | cat | cactus | cactus | cat touches cactus |
| 59 | cat | robot | cat | nimble cat evades mech |
| 60 | cat | rabbit | cat | predator catches prey |
| 61 | cat | mushroom | cat | forest hunter |
| 62 | cat | chonk | cat | fat cat lounges |
| 63 | dragon | octopus | dragon | sea vs sky |
| 64 | dragon | owl | dragon | power vs wisdom |
| 65 | dragon | penguin | penguin | ice vs fire → ice wins |
| 66 | dragon | turtle | turtle | both armored |
| 67 | dragon | snail | snail | dragon + shell = armored snail |
| 68 | dragon | ghost | ghost | undead dragon |
| 69 | dragon | axolotl | dragon | salamander evolves to dragon |
| 70 | dragon | capybara | capybara | dragon chills out |
| 71 | dragon | cactus | cactus | desert dragon |
| 72 | dragon | robot | robot | mecha-dragon |
| 73 | dragon | rabbit | rabbit | unlikely combo |
| 74 | dragon | mushroom | mushroom | fire + spores |
| 75 | dragon | chonk | chonk | chunky dragon |
| 76 | octopus | owl | owl | both brainy |
| 77 | octopus | penguin | penguin | deep sea pals |
| 78 | octopus | turtle | octopus | ocean dominance |
| 79 | octopus | snail | snail | both slimy |
| 80 | octopus | ghost | ghost | deep sea phantom |
| 81 | octopus | axolotl | axolotl | aquatic cuties |
| 82 | octopus | capybara | octopus | water friend → tentacle wins |
| 83 | octopus | cactus | cactus | tentacles + spines |
| 84 | octopus | robot | octopus | tentacle engineer |
| 85 | octopus | rabbit | octopus | caught by tentacles |
| 86 | octopus | mushroom | mushroom | deep growth |
| 87 | octopus | chonk | octopus | big squid |
| 88 | owl | penguin | penguin | formal night bird |
| 89 | owl | turtle | turtle | both wise |
| 90 | owl | snail | owl | predator + prey |
| 91 | owl | ghost | ghost | night spirits |
| 92 | owl | axolotl | axolotl | forest + water |
| 93 | owl | capybara | capybara | chill wisdom |
| 94 | owl | cactus | cactus | desert owl |
| 95 | owl | robot | robot | robo-owl |
| 96 | owl | rabbit | owl | hunter + prey |
| 97 | owl | mushroom | mushroom | forest friends |
| 98 | owl | chonk | chonk | big owl |
| 99 | penguin | turtle | turtle | both armored swimmers |
| 100 | penguin | snail | snail | both slow + determined |
| 101 | penguin | ghost | ghost | phantom penguin |
| 102 | penguin | axolotl | axolotl | aquatic cuties |
| 103 | penguin | capybara | capybara | both chill |
| 104 | penguin | cactus | duck | ice + desert = confused duck |
| 105 | penguin | robot | robot | mecha-penguin |
| 106 | penguin | rabbit | rabbit | both hoppy |
| 107 | penguin | mushroom | penguin | antarctic forager |
| 108 | penguin | chonk | chonk | chunky penguin |
| 109 | turtle | snail | snail | shell siblings |
| 110 | turtle | ghost | ghost | ancient spirit |
| 111 | turtle | axolotl | axolotl | water + armor |
| 112 | turtle | capybara | capybara | both slow + chill |
| 113 | turtle | cactus | cactus | both tough exterior |
| 114 | turtle | robot | robot | mecha-turtle |
| 115 | turtle | rabbit | rabbit | tortoise & hare |
| 116 | turtle | mushroom | turtle | forest floor shell |
| 117 | turtle | chonk | turtle | heavy armored shell |
| 118 | snail | ghost | ghost | slow ghost trail |
| 119 | snail | axolotl | axolotl | slimy friends |
| 120 | snail | capybara | capybara | both unbothered |
| 121 | snail | cactus | cactus | garden pair |
| 122 | snail | robot | robot | robo-snail |
| 123 | snail | rabbit | goose | slow + fast = chaotic goose |
| 124 | snail | mushroom | mushroom | damp garden |
| 125 | snail | chonk | blob | slimy + round = blob |
| 126 | ghost | axolotl | axolotl | undead cute |
| 127 | ghost | capybara | capybara | ghost chills |
| 128 | ghost | cactus | ghost | desert haunting |
| 129 | ghost | robot | robot | haunted machine |
| 130 | ghost | rabbit | rabbit | ghost bunny |
| 131 | ghost | mushroom | mushroom | spooky spores |
| 132 | ghost | chonk | blob | formless + round |
| 133 | axolotl | capybara | capybara | water friends |
| 134 | axolotl | cactus | duck | water + desert = pond duck |
| 135 | axolotl | robot | robot | mecha-lotl |
| 136 | axolotl | rabbit | rabbit | cute combo |
| 137 | axolotl | mushroom | mushroom | damp growth |
| 138 | axolotl | chonk | goose | round + cute = chaotic goose |
| 139 | capybara | cactus | goose | unbothered + prickly = goose attitude |
| 140 | capybara | robot | robot | robo-bara |
| 141 | capybara | rabbit | rabbit | both fuzzy |
| 142 | capybara | mushroom | duck | nature + chill = pond duck |
| 143 | capybara | chonk | chonk | maximum chill |
| 144 | cactus | robot | robot | desert machine |
| 145 | cactus | rabbit | rabbit | garden + speed |
| 146 | cactus | mushroom | mushroom | plant siblings |
| 147 | cactus | chonk | chonk | round cactus |
| 148 | robot | rabbit | rabbit | electric bunny |
| 149 | robot | mushroom | octopus | circuits + organic tendrils |
| 150 | robot | chonk | chonk | big robot |
| 151 | rabbit | mushroom | mushroom | garden combo |
| 152 | rabbit | chonk | chonk | chunky bunny |
| 153 | mushroom | chonk | chonk | round mushroom |

### Offspring Distribution (Balanced)

| Species | Count | Species | Count |
|---------|-------|---------|-------|
| duck | 9 | snail | 8 |
| goose | 9 | ghost | 8 |
| blob | 9 | axolotl | 8 |
| cat | 9 | capybara | 8 |
| dragon | 9 | cactus | 8 |
| octopus | 8 | robot | 9 |
| owl | 8 | rabbit | 9 |
| penguin | 8 | mushroom | 9 |
| turtle | 8 | chonk | 9 |

> **Balanced**: 9 species at 9 results + 9 species at 8 results = 153 total. Each species is equally obtainable through breeding.

### Data Model Changes

**settings.json** — add `breedEgg` field:
```json
{
  "backup": "...",
  "maxBuddy": 50,
  "pendingBuddy": null,
  "breedEgg": {
    "parentA": "uuid-a",
    "parentB": "uuid-b",
    "species": "axolotl",
    "eye": "✦",
    "hat": "wizard",
    "rarity": "rare",
    "createdAt": 1712160000000,
    "hatchAt": 1712160060000
  }
}
```

**collection.json** — offspring entries add `bredFrom` field:
```json
{
  "uuid": "hunted-uuid",
  "species": "axolotl",
  "rarity": "rare",
  "eye": "✦",
  "hat": "wizard",
  "shiny": false,
  "total": 245,
  "rolledAt": "2026-04-03T18:00:00Z",
  "bredFrom": ["uuid-parent-a", "uuid-parent-b"]
}
```

### TUI Flow

```
HOME SCREEN
├── Roll
├── Collection
├── Breed ← NEW
│   ├── Select Parent A (scrollable list)
│   ├── Select Parent B (scrollable list, excludes A)
│   ├── Preview: "ParentA × ParentB → Species (Rarity)"
│   ├── Confirm breed
│   ├── Egg screen (ASCII egg + countdown)
│   │   ├── Wait for hatch (live timer)
│   │   └── Exit (egg persists in settings)
│   └── Hatch reveal (buddy ASCII + stats)
├── Settings
└── Quit
```

**On app launch**: check `breedEgg` in settings. If exists and `Date.now() >= hatchAt`, show "Your egg is ready to hatch!" banner.

### Egg ASCII Art (Example)

```
    ___
   /   \
  | ··· |      common (white)
  |  ·  |
   \___/

    ___
   /%%%\
  |%%%%%|      legendary (gold)
  |%% %%|
   \%%%/
```

### New Files Needed

- `src/breed-engine.js` — breeding logic: table lookup, trait calculation, UUID hunt
- `src/breed-table.js` — the 153-pair lookup table as data
- `src/tui/views/breed-view.js` — TUI breed flow screens
- `src/tui/views/egg-view.js` — egg hatch countdown screen

### Modified Files

- `src/config.js` — add egg timing constants, egg color map
- `src/settings-manager.js` — add breedEgg read/write
- `src/collection.js` — support `bredFrom` field in entries
- `src/tui/views/home-view.js` — add "Breed" menu option
- `src/tui/controller.js` — add breed + egg view routing
- `src/tui/state.js` — add breed-related state

## Implementation Considerations

1. **UUID hunt performance**: Use `crypto.randomUUID()` in tight loop. For legendary (~86K attempts), benchmark to ensure < 5s. Can optimize by pre-checking rarity first (skip full roll if rarity doesn't match).
2. **Common hat constraint**: `rollFrom()` forces hat="none" for common rarity. Breeding must respect this — if offspring is common, hat inheritance is overridden to "none".
3. **Max collection**: breeding offspring counts toward maxBuddy limit. Block breeding if collection is full.
4. **Egg persistence**: only one egg at a time (simple). Multiple eggs would add complexity with no clear benefit.
5. **Backward compat**: `bredFrom` is optional field; existing collection entries remain valid.

## Risks

- **Table balance**: draft table heavily favors chonk/mushroom/robot. Need rebalancing pass.
- **UUID hunt edge cases**: very specific trait combos (e.g., legendary + rare eye + rare hat) could take long. Add timeout + fallback.
- **Settings file conflicts**: if user runs cb-zoo in multiple terminals, breedEgg could get corrupted. Low risk for CLI tool.

## Success Criteria

- User can breed any 2 buddies from collection
- Offspring species matches breeding table
- Eye/hat inherited from parents
- Egg timer works both on-screen and with exit/return
- Collection correctly stores bred buddies with lineage

## Next Steps

1. Rebalance breeding table (target 7-10 per species)
2. Design egg ASCII art for 5 rarity colors
3. Create implementation plan with phases
