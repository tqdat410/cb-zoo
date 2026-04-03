# Phase 3: Pending Buddy State in TUI

## Context
- Depends on: [Phase 1](phase-01-settings-manager.md), [Phase 2](phase-02-wire-uuid-collection.md)
- Current roll flow: `roll-flow.js:runRollSequence()` creates buddy in memory, lost on Back
- Roll state: `roll-config.js:createIdleRollState()` — no persistence
- Controller: `controller.js` handles Back → resets roll state, goes home

## Overview
- **Priority:** P1
- **Status:** completed
- Persist rolled buddy to `settings.pendingBuddy` on every roll
- Clear on equip/add, keep on back/reroll-overwrite
- Resume pending buddy on app launch or re-entering roll screen

## Related Code Files

### Modify
- `src/tui/roll-flow.js` — persist pendingBuddy after roll, clear on equip/add
- `src/tui/state.js` — load pendingBuddy on init, add resume logic
- `src/tui/controller.js` — resume pending when entering roll, keep on back
- `src/tui/views/roll-view.js` — show "Pending buddy" indicator when resuming
- `src/tui/views/home-view.js` — show indicator if pending buddy exists

## Implementation Steps

### roll-flow.js

1. **Import** `setPendingBuddy`, `clearPendingBuddy` from `settings-manager.js`.

2. **`runRollSequence()`** — after reveal phase assignment, persist:
   ```js
   // After state.roll = { ...revealed state... }
   setPendingBuddy(buddy);
   ```

3. **`applyRollAction()`** — clear pending on equip/add:
   - In `equip` branch: add `clearPendingBuddy()` after successful `applyUuid()`
   - In `add` branch: add `clearPendingBuddy()` after `ensureRollSaved()`
   - In `back` branch: do NOT clear (keep persisted)
   - In `reroll` branch: `runRollSequence()` will overwrite via `setPendingBuddy()`

### state.js

4. **Import** `getPendingBuddy` from `settings-manager.js`.

5. **New function `loadPendingRollState()`:**
   ```js
   export function loadPendingRollState() {
     const pending = getPendingBuddy();
     if (!pending) return null;
     const accent = getRarityAccent(pending.rarity);
     return {
       phase: "revealed",
       buddy: pending,
       actionIndex: 0,
       previewSpecies: pending.species,
       previewEye: pending.eye,
       previewRarity: pending.rarity,
       previewColor: accent.color,
       previewBurst: accent.burst,
       previewStars: accent.stars,
       savedToCollection: false
     };
   }
   ```
   Import `getRarityAccent` from `render-helpers.js`.

### controller.js

6. **Import** `loadPendingRollState` from `state.js`.

7. **`handleHomeAction()` roll branch** — before `runRollSequence()`, check for pending:
   ```js
   if (action === "roll") {
     const pendingRoll = loadPendingRollState();
     if (pendingRoll) {
       state.screen = "roll";
       state.roll = pendingRoll;
       state.statusMessage = "Resuming pending buddy.";
       return;
     }
     await runRollSequence(state, writeScreen);
     return;
   }
   ```

### home-view.js

8. **Import** `getPendingBuddy` from `settings-manager.js`.

9. **`renderHomeView()`** — modify Roll menu label when pending exists:
   ```js
   // In MENU_ITEMS rendering, check for pending
   const hasPending = getPendingBuddy() !== null;
   // Roll label becomes "Roll Buddy ●" or "Resume Roll" when pending
   ```
   Simplest approach: dynamically set label in the render loop rather than mutating MENU_ITEMS constant.

### roll-view.js

10. **No structural changes needed** — the revealed phase renderer already handles the `roll.buddy` object. The footer hint is sufficient. Optionally add a subtle "resumed" indicator in the status message (already handled by controller setting `statusMessage`).

## Todo

- [x] Persist buddy to settings on roll reveal
- [x] Clear pending on equip and add actions
- [x] Keep pending on back (do not clear)
- [x] Overwrite pending on reroll
- [x] Load pending state on app init / roll screen entry
- [x] Resume revealed screen if pending exists
- [x] Show pending indicator on home menu

## Success Criteria
- Roll → Back → relaunch app → Roll resumes with same buddy
- Roll → Equip → pending cleared from settings.json
- Roll → Add → pending cleared
- Roll → Reroll → old pending replaced
- Home menu shows indicator when pending exists

## Risks
| Risk | Mitigation |
|------|------------|
| Stale pendingBuddy after manual settings edit | Validate shape on load, clear if invalid |
| savedToCollection flag incorrect on resume | Default false; if buddy already in collection, user can add again (duplicate check exists) |
