import { applyUuid, backupUuid, hasBackup } from "../uuid-manager.js";
import { deleteCollectionEntry, loadCollection, saveToCollection } from "../collection.js";
import { rollFrom } from "../buddy-engine.js";
import { calculateOffspringTraits, huntUuid } from "../breed-engine.js";
import {
  clearBreedSlot,
  getBreedConfig,
  getBreedSlot,
  getBreedSlots,
  getMaxBuddy,
  isBreedSlotReady,
  setBreedSlot
} from "../settings-manager.js";
import { BREED_HATCH_ACTIONS, createEmptyBreedState } from "./breed-state.js";

function isShortcut(key, value) {
  return key.name === "text" && key.value.toLowerCase() === value;
}

function getBreedOptions(entries, excludedIndex = -1, excludedUuid = null) {
  return entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry, index }) => index !== excludedIndex && (excludedUuid == null || entry.uuid !== excludedUuid));
}

function syncBreedOptions(state, excludedIndex = -1, excludedUuid = null) {
  state.breed.options = getBreedOptions(state.breed.entries, excludedIndex, excludedUuid);
  state.breed.selectIndex = Math.min(state.breed.selectIndex, Math.max(0, state.breed.options.length - 1));
}

function refreshBreedSlots(state) {
  state.breed.slots = getBreedSlots();
  state.breed.selectIndex = Math.min(state.breed.selectIndex, Math.max(0, state.breed.slots.length - 1));
}

function getInitialSlotIndex(slots) {
  const readyIndex = slots.findIndex((slot) => slot && Date.now() >= slot.hatchAt);
  if (readyIndex >= 0) {
    return readyIndex;
  }
  const occupiedIndex = slots.findIndex(Boolean);
  return occupiedIndex >= 0 ? occupiedIndex : 0;
}

function refreshHatchCapacity(state) {
  state.breed.collectionFull = loadCollection().length >= getMaxBuddy();
}

function getHatchShortcutIndex(key) {
  if (key.name !== "text") {
    return -1;
  }
  return BREED_HATCH_ACTIONS.findIndex((action) => action.shortcut === key.value.toLowerCase());
}

function isBlockedHatchAction(state, actionId) {
  return state.breed.collectionFull && (actionId === "equip" || actionId === "add");
}

function getActiveHatchAction(state) {
  return BREED_HATCH_ACTIONS[state.breed.hatchActionIndex]?.id || BREED_HATCH_ACTIONS[0].id;
}

function getActiveSlotLabel(state) {
  return `Slot ${state.breed.slotIndex + 1}`;
}

export function stopBreedTimer(state) {
  if (state.breed.timer) {
    clearInterval(state.breed.timer);
    state.breed.timer = null;
  }
}

function leaveBreedScreen(state, message) {
  stopBreedTimer(state);
  state.screen = "home";
  state.breed = createEmptyBreedState();
  state.statusMessage = message;
}

async function resolveHatchedBuddy(slotIndex, egg) {
  if (egg.hatchedUuid) {
    return {
      ...rollFrom(egg.hatchedUuid),
      bredFrom: [egg.parentA, egg.parentB]
    };
  }
  const buddy = await Promise.resolve(huntUuid({
    species: egg.species,
    eye: egg.eye,
    hat: egg.hat,
    rarity: egg.rarity,
    shiny: egg.shiny
  }));
  setBreedSlot(slotIndex, { ...egg, hatchedUuid: buddy.uuid });
  return {
    ...buddy,
    bredFrom: [egg.parentA, egg.parentB]
  };
}

async function hatchEgg(state, writeScreen) {
  stopBreedTimer(state);
  const egg = getBreedSlot(state.breed.slotIndex);
  if (!egg) {
    leaveBreedScreen(state, `${getActiveSlotLabel(state)} is empty.`);
    return;
  }

  state.breed.phase = "egg";
  state.breed.egg = egg;
  state.statusMessage = `Hatching ${getActiveSlotLabel(state).toLowerCase()}...`;
  writeScreen(state);

  state.breed.phase = "hatch";
  state.breed.egg = getBreedSlot(state.breed.slotIndex) || egg;
  state.breed.hatchedBuddy = await resolveHatchedBuddy(state.breed.slotIndex, state.breed.egg);
  state.breed.hatchActionIndex = 0;
  refreshHatchCapacity(state);
  state.statusMessage = `${getActiveSlotLabel(state)} ready: choose add, equip, or delete.`;
  writeScreen(state);
}

function startEggTimer(state, writeScreen) {
  stopBreedTimer(state);
  state.breed.timer = setInterval(() => {
    if (state.screen !== "breed" || state.breed.phase !== "egg") {
      stopBreedTimer(state);
      return;
    }
    if (isBreedSlotReady(state.breed.slotIndex)) {
      void hatchEgg(state, writeScreen).catch((error) => {
        leaveBreedScreen(state, error.message);
        writeScreen(state);
      });
      return;
    }
    writeScreen(state);
  }, 1000);
}

function beginEgg(state, writeScreen) {
  const createdAt = Date.now();
  const hatchTimes = getBreedConfig().hatchTimes;
  const hatchAt = createdAt + hatchTimes[state.breed.offspringTraits.rarity];
  const egg = {
    parentA: state.breed.parentA.uuid,
    parentB: state.breed.parentB.uuid,
    species: state.breed.offspringTraits.species,
    eye: state.breed.offspringTraits.eye,
    hat: state.breed.offspringTraits.hat,
    rarity: state.breed.offspringTraits.rarity,
    shiny: state.breed.offspringTraits.shiny,
    createdAt,
    hatchAt
  };
  setBreedSlot(state.breed.slotIndex, egg);
  refreshBreedSlots(state);
  state.breed.phase = "egg";
  state.breed.egg = egg;
  state.statusMessage = `${getActiveSlotLabel(state)} started: ${egg.rarity} ${egg.species}.`;
  startEggTimer(state, writeScreen);
}

function addHatchedBuddy(state) {
  const savedEntry = saveToCollection(state.breed.hatchedBuddy);
  clearBreedSlot(state.breed.slotIndex);
  leaveBreedScreen(state, `${getActiveSlotLabel(state)} hatched: ${savedEntry.species} added to collection.`);
}

function deleteHatchedBuddy(state) {
  clearBreedSlot(state.breed.slotIndex);
  leaveBreedScreen(state, `${getActiveSlotLabel(state)} discarded.`);
}

function ensureHatchedBuddySaved(state) {
  const savedEntry = saveToCollection(state.breed.hatchedBuddy);
  refreshHatchCapacity(state);
  return savedEntry;
}

function ensureEquipBackup() {
  if (!hasBackup()) {
    backupUuid();
  }
}

function equipHatchedBuddy(state) {
  const egg = state.breed.egg;
  let savedEntry = null;
  try {
    savedEntry = ensureHatchedBuddySaved(state);
    ensureEquipBackup();
    clearBreedSlot(state.breed.slotIndex);
  } catch (error) {
    if (savedEntry) {
      try {
        deleteCollectionEntry(savedEntry);
        refreshHatchCapacity(state);
      } catch (rollbackError) {
        throw new Error(`${error.message} Rollback failed: ${rollbackError.message}`);
      }
    }
    state.statusMessage = error.message;
    return;
  }

  try {
    applyUuid(state.breed.hatchedBuddy.uuid);
    leaveBreedScreen(state, `${getActiveSlotLabel(state)} hatched: ${savedEntry.species} equipped. Restart Claude Code.`);
  } catch (error) {
    if (savedEntry) {
      try {
        deleteCollectionEntry(savedEntry);
        if (egg) {
          setBreedSlot(state.breed.slotIndex, egg);
        }
        refreshHatchCapacity(state);
      } catch (rollbackError) {
        throw new Error(`${error.message} Rollback failed: ${rollbackError.message}`);
      }
    }
    state.statusMessage = error.message;
  }
}

async function openSelectedSlot(state, writeScreen) {
  const slotIndex = state.breed.selectIndex;
  const egg = state.breed.slots[slotIndex] ?? null;
  state.breed.slotIndex = slotIndex;

  if (!egg) {
    if (state.breed.entries.length < 2) {
      state.statusMessage = "Breed needs at least 2 buddies in collection.";
      return;
    }
    state.breed.phase = "select-a";
    state.breed.parentA = null;
    state.breed.parentB = null;
    state.breed.selectIndex = 0;
    syncBreedOptions(state);
    state.statusMessage = `Choose the first parent for ${getActiveSlotLabel(state).toLowerCase()}.`;
    return;
  }

  state.breed.phase = "egg";
  state.breed.egg = egg;
  state.breed.parentA = state.breed.entries.find((entry) => entry.uuid === egg.parentA) || null;
  state.breed.parentB = state.breed.entries.find((entry) => entry.uuid === egg.parentB) || null;
  state.statusMessage = isBreedSlotReady(slotIndex)
    ? `${getActiveSlotLabel(state)} ready to hatch.`
    : `${getActiveSlotLabel(state)} incubating.`;

  if (isBreedSlotReady(slotIndex)) {
    await hatchEgg(state, writeScreen);
  } else {
    startEggTimer(state, writeScreen);
  }
}

export async function openBreedFlow(state, writeScreen) {
  const entries = loadCollection().slice().reverse();
  const slots = getBreedSlots();
  if (!slots.some(Boolean) && entries.length < 2) {
    state.statusMessage = "Breed needs at least 2 buddies in collection.";
    return;
  }

  state.screen = "breed";
  state.breed = {
    ...createEmptyBreedState(),
    phase: "slot-select",
    entries,
    slots,
    selectIndex: getInitialSlotIndex(slots)
  };
  state.statusMessage = "Choose a breed slot.";
}

export async function handleBreedKeypress(state, key, writeScreen) {
  if (state.breed.phase === "slot-select") {
    if (key.name === "escape") {
      leaveBreedScreen(state, "Breed cancelled.");
    } else if (key.name === "up" || isShortcut(key, "k")) {
      state.breed.selectIndex = Math.max(0, state.breed.selectIndex - 1);
    } else if (key.name === "down" || isShortcut(key, "j")) {
      state.breed.selectIndex = Math.min(state.breed.slots.length - 1, state.breed.selectIndex + 1);
    } else if (key.name === "enter") {
      await openSelectedSlot(state, writeScreen);
    }
    return;
  }

  if (state.breed.phase === "select-a") {
    if (key.name === "escape") {
      refreshBreedSlots(state);
      state.breed.phase = "slot-select";
      state.breed.selectIndex = state.breed.slotIndex;
      state.statusMessage = "Choose a breed slot.";
    } else if (key.name === "up" || isShortcut(key, "k")) {
      state.breed.selectIndex = Math.max(0, state.breed.selectIndex - 1);
    } else if (key.name === "down" || isShortcut(key, "j")) {
      state.breed.selectIndex = Math.min(state.breed.options.length - 1, state.breed.selectIndex + 1);
    } else if (key.name === "enter" && state.breed.options[state.breed.selectIndex]) {
      const selected = state.breed.options[state.breed.selectIndex];
      state.breed.parentA = selected.entry;
      state.breed.parentAIndex = selected.index;
      state.breed.parentB = null;
      state.breed.phase = "select-b";
      state.breed.selectIndex = 0;
      syncBreedOptions(state, selected.index, selected.entry.uuid);
      if (state.breed.options.length === 0) {
        state.breed.phase = "select-a";
        syncBreedOptions(state);
        state.statusMessage = "Choose a buddy with a different UUID.";
        return;
      }
      state.statusMessage = `Choose the second parent for ${getActiveSlotLabel(state).toLowerCase()}.`;
    }
    return;
  }

  if (state.breed.phase === "select-b") {
    if (key.name === "escape" || key.name === "left") {
      state.breed.phase = "select-a";
      state.breed.selectIndex = 0;
      syncBreedOptions(state);
      state.statusMessage = `Choose the first parent for ${getActiveSlotLabel(state).toLowerCase()}.`;
    } else if (key.name === "up" || isShortcut(key, "k")) {
      state.breed.selectIndex = Math.max(0, state.breed.selectIndex - 1);
    } else if (key.name === "down" || isShortcut(key, "j")) {
      state.breed.selectIndex = Math.min(state.breed.options.length - 1, state.breed.selectIndex + 1);
    } else if (key.name === "enter" && state.breed.options[state.breed.selectIndex]) {
      const selected = state.breed.options[state.breed.selectIndex];
      state.breed.parentB = selected.entry;
      state.breed.parentBIndex = selected.index;
      state.breed.phase = "confirm";
      state.statusMessage = `Confirm ${getActiveSlotLabel(state).toLowerCase()}.`;
    }
    return;
  }

  if (state.breed.phase === "confirm") {
    if (key.name === "escape" || key.name === "left") {
      state.breed.phase = "select-b";
      state.statusMessage = `Choose the second parent for ${getActiveSlotLabel(state).toLowerCase()}.`;
    } else if (key.name === "enter") {
      state.breed.offspringTraits = calculateOffspringTraits(state.breed.parentA, state.breed.parentB);
      beginEgg(state, writeScreen);
    }
    return;
  }

  if (state.breed.phase === "egg") {
    if (key.name === "escape") {
      leaveBreedScreen(
        state,
        isBreedSlotReady(state.breed.slotIndex)
          ? `${getActiveSlotLabel(state)} ready to hatch.`
          : `${getActiveSlotLabel(state)} saved. Come back when it is ready.`
      );
    }
    return;
  }

  if (state.breed.phase === "hatch") {
    const shortcutIndex = getHatchShortcutIndex(key);
    if (key.name === "escape") {
      leaveBreedScreen(state, `${getActiveSlotLabel(state)} ready to hatch.`);
      return;
    }
    if (key.name === "left" || isShortcut(key, "h")) {
      state.breed.hatchActionIndex = (state.breed.hatchActionIndex + BREED_HATCH_ACTIONS.length - 1) % BREED_HATCH_ACTIONS.length;
      return;
    }
    if (key.name === "right" || isShortcut(key, "l")) {
      state.breed.hatchActionIndex = (state.breed.hatchActionIndex + 1) % BREED_HATCH_ACTIONS.length;
      return;
    }
    if (shortcutIndex >= 0) {
      state.breed.hatchActionIndex = shortcutIndex;
    }
    if (shortcutIndex >= 0 || key.name === "enter") {
      const action = getActiveHatchAction(state);
      refreshHatchCapacity(state);
      if (isBlockedHatchAction(state, action)) {
        state.statusMessage = `Collection full (${loadCollection().length}/${getMaxBuddy()}). Delete a buddy first or discard this hatch.`;
        return;
      }
      if (action === "equip") {
        equipHatchedBuddy(state);
        return;
      }
      if (action === "add") {
        addHatchedBuddy(state);
        return;
      }
      deleteHatchedBuddy(state);
    }
  }
}
