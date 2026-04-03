# Phase 2: Egg Persistence and Collection Lineage

## Context Links

- [settings-manager.js](../../src/settings-manager.js)
- [collection.js](../../src/collection.js)
- [Phase 1](./phase-01-breed-engine-and-table.md)
- [System architecture](../../docs/system-architecture.md)

## Overview

- **Priority:** P1
- **Status:** completed
- **Brief:** Extend local persistence with one `breedEgg` record and optional `bredFrom` lineage while keeping old settings/collection files valid.

## Key Insights

- The current repo already has a safe pattern for local JSON state: BOM-tolerant reads, validation, temp-file writes, fail closed on corrupt data.
- `settings.json` is the right home for a single incubating egg because pending roll state already lives there.
- `collection.json` should stay backward compatible. `bredFrom` must remain optional.
- Restart UX is cleaner if the egg record stores lightweight parent display info instead of re-reading the collection later.

## Requirements

### Functional Requirements

- Add `breedEgg` to the settings schema, defaulting to `null`.
- Add `getBreedEgg()`, `setBreedEgg()`, `clearBreedEgg()`, and `isBreedEggReady(now?)`.
- Persist enough egg metadata to resume after restart:
  - parent UUIDs
  - lightweight parent species labels for display
  - offspring species, eye, hat, rarity, shiny
  - `createdAt`
  - `hatchAt`
- Accept collection entries with optional `bredFrom: [uuidA, uuidB]`.

### Non-Functional Requirements

- No migration required beyond defaulting missing `breedEgg` to `null`.
- Existing settings and collection files must continue to parse unchanged.
- Keep writes atomic and validation strict.

## Architecture

```json
{
  "backup": null,
  "maxBuddy": 50,
  "pendingBuddy": null,
  "breedEgg": {
    "parentAUuid": "uuid-a",
    "parentASpecies": "duck",
    "parentBUuid": "uuid-b",
    "parentBSpecies": "goose",
    "species": "goose",
    "eye": "✦",
    "hat": "wizard",
    "rarity": "rare",
    "shiny": false,
    "createdAt": 1775208000000,
    "hatchAt": 1775208060000
  }
}
```

- The exact field names can vary during implementation, but the persisted record should stay flat and small.
- `bredFrom` remains a two-UUID tuple on collection entries. No nested lineage tree.

## Related Code Files

### Modify

- `src/settings-manager.js`
- `src/collection.js`

### Create

- None required in this phase

### Read Only

- `src/config.js`
- `src/breed-engine.js`

### Delete

- None.

## Implementation Steps

1. Extend `loadSettings()` defaults to include `breedEgg: null`.
2. Add a focused `normalizeBreedEgg()` validator:
   - validate UUIDs
   - validate species/rarity membership
   - validate timestamps as finite numbers
   - drop invalid on read, reject invalid on write
3. Add accessors:
   - `getBreedEgg()`
   - `setBreedEgg(egg)`
   - `clearBreedEgg()`
   - `isBreedEggReady(now = Date.now())`
4. Keep `saveSettings()` payload explicit. Do not spread unknown fields through to disk.
5. Extend `collection.js` validation:
   - `bredFrom` absent or `["uuid-a","uuid-b"]`
   - no other lineage shapes
6. Update `saveToCollection()` so a breed result can pass `bredFrom` through without changing normal roll saves.
7. Keep breed persistence schema-only here. Do not add TUI timers or hatch logic in this module.

## Todo List

- [x] Add `breedEgg` default to settings loads
- [x] Add strict egg validator and accessors
- [x] Add readiness helper with injected `now`
- [x] Extend collection entry validation for optional `bredFrom`
- [x] Preserve atomic write and corrupt-file behavior

## Success Criteria

- Old settings files without `breedEgg` load as valid defaults.
- Valid eggs round-trip through settings.
- Invalid eggs are dropped on read and rejected on write.
- Old collection entries and new lineage entries both validate.

## Risk Assessment

- **Schema drift between Phase 1 and Phase 4:** mitigate by keeping one egg shape owned by the domain layer.
- **Settings-manager growth:** if the module approaches the file-size ceiling, extract egg validation helpers instead of packing more branches into the file.
- **Collection validator sprawl:** keep lineage validation to a tiny tuple check only.

## Security Considerations

- Do not trust `settings.json` or `collection.json`; keep the same fail-closed posture as the rest of the repo.
- Never persist executable callbacks, timer handles, or full buddy stats in `breedEgg`.
- Reject malformed lineage tuples before writing collection changes.

## Next Steps

Phase 3 renders the new breed and egg states without side effects.
