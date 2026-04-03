import { getCurrentCompanion } from "../companion-state.js";
import { loadCollection } from "../collection.js";
import { getCurrentUuid } from "../uuid-manager.js";
import { rollFrom } from "../buddy-engine.js";
import { renderHomeView } from "./views/home-view.js";
import { renderRollView } from "./views/roll-view.js";
import { renderCurrentView } from "./views/current-view.js";
import { renderCollectionView } from "./views/collection-view.js";
import { renderEditView } from "./views/edit-view.js";
import { createIdleRollState } from "./roll-config.js";

export function createInitialState() {
  return {
    screen: "home",
    menuIndex: 0,
    statusMessage: "Welcome back to cb-zoo.",
    shouldExit: false,
    busy: false,
    roll: createIdleRollState(),
    collectionEntries: [],
    collectionIndex: 0,
    collectionPrompt: { mode: "browse" },
    currentCompanion: null,
    currentBuddy: null,
    edit: { activeField: "name", name: "", personality: "", error: "", confirmReset: false }
  };
}

export function renderScreen(state, terminal = {}) {
  if (state.screen === "roll") {
    return renderRollView(state, terminal);
  }
  if (state.screen === "current") {
    return renderCurrentView(state, terminal);
  }
  if (state.screen === "collection") {
    return renderCollectionView(state, terminal);
  }
  if (state.screen === "edit") {
    return renderEditView(state, terminal);
  }
  return renderHomeView(state, terminal);
}

export function syncCurrent(state) {
  const companion = getCurrentCompanion();
  state.currentCompanion = companion;
  state.currentBuddy = companion ? null : rollFrom(getCurrentUuid({ allowLegacyUserId: true }));
}

export function syncCollection(state) {
  state.collectionEntries = loadCollection().slice().reverse();
  state.collectionIndex = Math.min(state.collectionIndex, Math.max(0, state.collectionEntries.length - 1));
  if (state.collectionEntries.length === 0) {
    state.collectionIndex = 0;
  }
}

export function resetCollectionPrompt(state) {
  state.collectionPrompt = { mode: "browse" };
}

export function openEdit(state) {
  syncCurrent(state);
  if (!state.currentCompanion) {
    state.statusMessage = "No stored companion to edit yet.";
    state.screen = "home";
    return;
  }
  state.edit = {
    activeField: "name",
    name: state.currentCompanion.name,
    personality: state.currentCompanion.personality || "",
    error: "",
    confirmReset: false
  };
  state.screen = "edit";
}
