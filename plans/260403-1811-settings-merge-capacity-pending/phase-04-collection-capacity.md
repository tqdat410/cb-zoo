# Phase 4: Collection Capacity Display + Enforcement

## Context
- Depends on: [Phase 1](phase-01-settings-manager.md), [Phase 2](phase-02-wire-uuid-collection.md)
- Collection view: `src/tui/views/collection-view.js` — currently shows `"X buddies in collection."`
- Roll action enforcement: `src/tui/roll-flow.js` and `src/tui/controller.js`
- Plain CLI collection display: `src/collection.js:formatCollection()`

## Overview
- **Priority:** P1
- **Status:** completed
- Show `count/maxBuddy` in collection view subtitle and status
- Disable add/equip in roll screen when collection full
- Update plain CLI collection output

## Related Code Files

### Modify
- `src/tui/views/collection-view.js` — show capacity in subtitle/status
- `src/tui/roll-flow.js` — guard ensureRollSaved against full collection
- `src/tui/controller.js` — disable apply from collection screen when full
- `src/collection.js` — update `formatCollection()` plain output

## Implementation Steps

### collection-view.js

1. **Import** `getMaxBuddy` from `settings-manager.js`.

2. **`renderCollectionView()`** — update status line:
   ```js
   const maxBuddy = getMaxBuddy();
   const capacityLabel = `${entries.length}/${maxBuddy}`;
   // ...
   status: state.statusMessage || `${capacityLabel} buddies in collection.`
   ```

3. **Subtitle** — change from static `"Saved buddy collection"` to include capacity:
   ```js
   subtitle: `${entries.length}/${maxBuddy} buddies`
   ```

4. **Empty state** — show `0/${maxBuddy}` instead of just "Collection empty."

### roll-flow.js

5. **Import** `getMaxBuddy` from `settings-manager.js`, `loadCollection` from `collection.js`.

6. **`ensureRollSaved()`** — add capacity guard:
   ```js
   function ensureRollSaved(state) {
     if (state.roll.savedToCollection || !state.roll.buddy) return null;
     const maxBuddy = getMaxBuddy();
     const current = loadCollection();
     if (current.length >= maxBuddy) {
       throw new Error(`Collection full (${current.length}/${maxBuddy}). Delete a buddy first.`);
     }
     // ... existing save logic
   }
   ```

7. **`applyRollAction()` equip/add** — catch the capacity error and set status message instead of crashing:
   ```js
   if (action === "equip") {
     try {
       const savedEntry = ensureRollSaved(state);
       applyUuid(buddy.uuid);
       // ... success path
     } catch (error) {
       state.statusMessage = error.message;
       return;
     }
   }
   ```
   Same for `add` action.

### controller.js — collection apply

8. **Collection apply action** — add capacity check before `applyUuid`:
   Already guarded by `saveToCollection` throwing in Phase 2, but apply-from-collection doesn't save — it just calls `applyUuid()`. Apply from collection should still work even when full (it doesn't add a new entry). No change needed here.

### collection.js — plain CLI

9. **`formatCollection()`** — update the total line:
   ```js
   import { getMaxBuddy } from "./settings-manager.js";
   // ...
   `Total Rolls: ${stats.total}/${getMaxBuddy()}`
   ```

## Todo

- [x] Show count/capacity in collection view subtitle
- [x] Show count/capacity in collection status line
- [x] Show 0/max on empty collection
- [x] Guard ensureRollSaved() against full collection
- [x] Catch capacity error in equip/add actions gracefully
- [x] Update formatCollection() plain CLI output

## Success Criteria
- Collection view shows "3/50 buddies" in subtitle
- Status shows "3/50 buddies in collection."
- Empty collection shows "0/50"
- Equip/Add from roll screen shows "Collection full" when at capacity
- Apply from collection screen still works (doesn't add entry)
- Plain CLI `--collection` shows capacity

## Risks
| Risk | Mitigation |
|------|------------|
| Equip blocked when full (user can't use rolled buddy) | Equip applies UUID but save fails — need to handle: apply UUID first, then try save. If save fails, UUID still applied, just not in collection |
