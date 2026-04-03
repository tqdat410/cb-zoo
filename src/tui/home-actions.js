import { backupUuid, restoreUuid } from "../uuid-manager.js";
import { getHomeMenuItems } from "./views/home-view.js";
import { runRollSequence } from "./roll-flow.js";
import { loadPendingRollState, openEdit, resetCollectionPrompt, syncCollection, syncCurrent } from "./state.js";
import { openBreedFlow } from "./breed-flow.js";

export async function handleHomeAction(state, writeScreen) {
  const action = getHomeMenuItems()[state.menuIndex]?.id;
  if (action === "quit") {
    state.shouldExit = true;
    return;
  }
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
  if (action === "current") {
    syncCurrent(state);
    state.screen = "current";
    state.statusMessage = "Current buddy loaded.";
    return;
  }
  if (action === "collection") {
    syncCollection(state);
    resetCollectionPrompt(state);
    state.screen = "collection";
    state.statusMessage = "Browsing collection.";
    return;
  }
  if (action === "breed") {
    await openBreedFlow(state, writeScreen);
    return;
  }
  if (action === "edit") {
    openEdit(state);
    return;
  }
  if (action === "backup") {
    const result = backupUuid();
    state.statusMessage = result.created ? "UUID backup created." : "Backup already exists.";
    return;
  }
  if (action === "restore") {
    const result = restoreUuid();
    state.statusMessage = `Restored UUID ${result.uuid}.`;
  }
}
