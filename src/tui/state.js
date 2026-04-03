import { getCurrentCompanion } from "../companion-state.js";
import { hasCollectionEntryForBuddy, loadCollection } from "../collection.js";
import { getMaxBuddy, getPendingBuddy } from "../settings-manager.js";
import { getCurrentUuid } from "../uuid-manager.js";
import { rollFrom } from "../buddy-engine.js";
import { createEmptyBreedState } from "./breed-state.js";
import { renderHomeView } from "./views/home-view.js";
import { renderRollView } from "./views/roll-view.js";
import { renderCurrentView } from "./views/current-view.js";
import { renderCollectionView } from "./views/collection-view.js";
import { renderEditView } from "./views/edit-view.js";
import { renderBreedConfirm, renderBreedSelectA, renderBreedSelectB, renderBreedSlotSelect } from "./views/breed-view.js";
import { renderEggView, renderHatchView } from "./views/egg-view.js";
import { createIdleRollState } from "./roll-config.js";
import { ANSI, getRarityAccent } from "./render-helpers.js";
import { formatRollCountdown, getRollChargeSnapshot } from "../roll-charge-manager.js";

function attachTopRightMeta(view) {
  if (view.topRight) {
    return view;
  }
  const snapshot = getRollChargeSnapshot();
  const collectionCount = loadCollection().length;
  const countdown = snapshot.isFull ? "--:--" : formatRollCountdown(snapshot.msUntilNext);
  return {
    ...view,
    topRight: `${ANSI.dim}${collectionCount}/${getMaxBuddy()} | ${snapshot.available}/${snapshot.maxCharges} | ${countdown}${ANSI.reset}`
  };
}

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
    edit: { activeField: "name", name: "", personality: "", error: "", confirmReset: false },
    breed: createEmptyBreedState()
  };
}

export function renderScreen(state, terminal = {}) {
  if (state.screen === "roll") {
    return attachTopRightMeta(renderRollView(state, terminal));
  }
  if (state.screen === "current") {
    return attachTopRightMeta(renderCurrentView(state, terminal));
  }
  if (state.screen === "collection") {
    return attachTopRightMeta(renderCollectionView(state, terminal));
  }
  if (state.screen === "edit") {
    return attachTopRightMeta(renderEditView(state, terminal));
  }
  if (state.screen === "breed") {
    if (state.breed.phase === "slot-select") {
      return attachTopRightMeta(renderBreedSlotSelect(state, terminal));
    }
    if (state.breed.phase === "select-a") {
      return attachTopRightMeta(renderBreedSelectA(state, terminal));
    }
    if (state.breed.phase === "select-b") {
      return attachTopRightMeta(renderBreedSelectB(state, terminal));
    }
    if (state.breed.phase === "confirm") {
      return attachTopRightMeta(renderBreedConfirm(state, terminal));
    }
    if (state.breed.phase === "hatch") {
      return attachTopRightMeta(renderHatchView(state, terminal));
    }
    return attachTopRightMeta(renderEggView(state, terminal));
  }
  return attachTopRightMeta(renderHomeView(state, terminal));
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

export function loadPendingRollState() {
  const pendingBuddy = getPendingBuddy();
  if (!pendingBuddy) {
    return null;
  }
  const rehydratedBuddy = {
    ...rollFrom(pendingBuddy.uuid),
    rolledAt: pendingBuddy.rolledAt
  };
  const accent = getRarityAccent(rehydratedBuddy.rarity);
  const savedToCollection = hasCollectionEntryForBuddy(rehydratedBuddy);
  return {
    phase: "revealed",
    buddy: rehydratedBuddy,
    actionIndex: 0,
    previewSpecies: rehydratedBuddy.species,
    previewEye: rehydratedBuddy.eye,
    previewRarity: rehydratedBuddy.rarity,
    previewColor: accent.color,
    previewBurst: accent.burst,
    previewStars: accent.stars,
    savedToCollection,
    collectionFull: loadCollection().length >= getMaxBuddy()
  };
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
