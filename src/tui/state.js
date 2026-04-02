import { getCurrentCompanion } from "../companion-state.js";
import { loadCollection } from "../collection.js";
import { getCurrentUuid } from "../uuid-manager.js";
import { rollFrom } from "../buddy-engine.js";
import { renderHomeView } from "./views/home-view.js";
import { renderRollView } from "./views/roll-view.js";
import { renderCurrentView } from "./views/current-view.js";
import { renderCollectionView } from "./views/collection-view.js";
import { renderEditView } from "./views/edit-view.js";

export function createInitialState() {
  return {
    screen: "home",
    menuIndex: 0,
    statusMessage: "Welcome back, trainer.",
    shouldExit: false,
    busy: false,
    roll: {
      phase: "idle",
      buddy: null,
      actionIndex: 0,
      previewSpecies: "cat",
      previewEye: "·",
      previewRarity: "common",
      previewColor: "",
      previewBurst: ""
    },
    collectionEntries: [],
    collectionIndex: 0,
    currentCompanion: null,
    currentBuddy: null,
    edit: { activeField: "name", name: "", personality: "", error: "" }
  };
}

export function renderScreen(state) {
  if (state.screen === "roll") {
    return renderRollView(state);
  }
  if (state.screen === "current") {
    return renderCurrentView(state);
  }
  if (state.screen === "collection") {
    return renderCollectionView(state);
  }
  if (state.screen === "edit") {
    return renderEditView(state);
  }
  return renderHomeView(state);
}

export function syncCurrent(state) {
  const companion = getCurrentCompanion();
  state.currentCompanion = companion;
  state.currentBuddy = companion ? null : rollFrom(getCurrentUuid({ allowLegacyUserId: true }));
}

export function syncCollection(state) {
  state.collectionEntries = loadCollection().slice().reverse();
  state.collectionIndex = Math.min(state.collectionIndex, Math.max(0, state.collectionEntries.length - 1));
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
    error: ""
  };
  state.screen = "edit";
}
