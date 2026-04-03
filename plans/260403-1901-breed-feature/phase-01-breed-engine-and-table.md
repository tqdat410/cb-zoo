# Phase 1: Breed Domain and Table

## Context Links

- [Brainstorm report](../reports/brainstorm-260403-1828-breed-feature.md)
- [buddy-engine.js](../../src/buddy-engine.js)
- [config.js](../../src/config.js)
- [code-standards.md](../../docs/code-standards.md)

## Overview

- **Priority:** P1
- **Status:** completed
- **Brief:** Add the domain layer that knows breeding outcomes, egg rarity/timing, and UUID hunting. Keep it pure and testable.

## Key Insights

- `rollFrom(uuid)` already defines the real buddy contract. Breed logic should target that contract, not invent a parallel buddy model.
- The brainstorm table has `153` cross-species pairs plus `18` same-species diagonals. Store only canonical cross-pair keys and derive the diagonal to keep the data file smaller.
- Common rarity always forces `hat = "none"` in `rollFrom()`. Breed planning must preserve that or UUID hunt can never succeed.
- Direct `Math.random()` / `Date.now()` calls make tests flaky. Inject `rng`, `now`, and `uuidFactory` seams into the new domain helpers.

## Requirements

### Functional Requirements

- Resolve offspring species from the brainstorm breeding table.
- Build a persisted egg payload from two collection entries.
- Compute inherited eye, hat, rarity, shiny, `createdAt`, and `hatchAt`.
- Hunt for a UUID whose `rollFrom()` output matches the target egg traits.
- Reject breeding the same saved buddy against itself.

### Non-Functional Requirements

- Zero new runtime dependencies.
- Keep the table/data module read-only and side-effect free.
- Keep domain functions deterministic under injected `rng` / `now`.
- Keep UUID hunt bounded with a clear failure path.

## Architecture

```text
src/breed-table.js
  - makeBreedPairKey(speciesA, speciesB)
  - getBreedOffspringSpecies(speciesA, speciesB)

src/breed-engine.js
  - buildBreedEgg(parentA, parentB, { rng, now })
  - hatchBreedEgg(egg, { uuidFactory, maxAttempts })
  - optional tiny helpers for rarity math / inherited trait picks
```

- `breed-table.js` should use a flat canonical object such as `{"duck:goose":"goose"}`. No nested maps needed.
- `buildBreedEgg()` should return the exact persisted egg shape Phase 2 saves.
- `hatchBreedEgg()` should return a real buddy object ready for `saveToCollection()`, with `bredFrom` attached by the caller or by the helper.

## Related Code Files

### Modify

- `src/config.js`

### Create

- `src/breed-table.js`
- `src/breed-engine.js`

### Read Only

- `src/buddy-engine.js`
- `src/collection.js`

### Delete

- None.

## Implementation Steps

1. In `src/config.js`, add only breed-specific constants that are true configuration, not behavior:
   - `BREED_HATCH_MS_BY_RARITY`
   - `BREED_RARITY_BONUS_CHANCE`
   - `BREED_HUNT_MAX_ATTEMPTS`
2. Create `src/breed-table.js` with:
   - a canonical pair-key helper that sorts two species names
   - `153` cross-pair results from the brainstorm report
   - same-species fallback returning the same species without storing extra diagonal rows
3. Create `src/breed-engine.js` with a small API:
   - `buildBreedEgg(parentA, parentB, { rng = Math.random, now = Date.now })`
   - `hatchBreedEgg(egg, { uuidFactory = randomUUID, maxAttempts = BREED_HUNT_MAX_ATTEMPTS })`
4. Keep rarity calculation in one helper:
   - average parent rarity tiers
   - apply the `15%` upgrade chance
   - clamp to `legendary`
5. Keep inherited eye/hat logic in one helper:
   - eye must come from one of the two parents
   - hat must come from one of the two parents unless rarity resolves to `common`, then hard-force `"none"`
6. In UUID hunt, compare cheap fields first:
   - rarity
   - species
   - eye
   - hat
   - shiny only when the egg requires shiny
7. Fail with a plain error if the hunt exceeds `maxAttempts`. No spinner or retry loop in the domain layer.

## Todo List

- [x] Add breed constants to `src/config.js`
- [x] Create canonical breed table module
- [x] Create egg builder with injected `rng` / `now`
- [x] Create UUID hatching helper with injected `uuidFactory`
- [x] Enforce common-hat rule in one place
- [x] Reject same-parent breeding and invalid species/rarity inputs

## Success Criteria

- Every unordered species pair resolves to one valid offspring species.
- `buildBreedEgg()` returns stable output under injected `rng` and `now`.
- `hatchBreedEgg()` can produce a real matching buddy for feasible targets and fails cleanly for impossible or capped hunts.
- The new domain layer does not need TUI imports.

## Risk Assessment

- **Table transcription mistakes:** mitigate with exhaustive pair tests in Phase 5.
- **Slow legendary hunt:** mitigate with bounded attempts and cheap-field filtering.
- **Impossible common-hat combos:** mitigate by forcing common hats to `"none"` before persistence.

## Security Considerations

- Validate all species and rarity values against `config.js` exports before building or hatching eggs.
- Reject malformed parent UUIDs or reused parent UUIDs before any settings write.
- Keep the hunt pure; it must not mutate settings or collection state.

## Next Steps

Phase 2 persists the egg shape from this phase and teaches collection storage about lineage.
