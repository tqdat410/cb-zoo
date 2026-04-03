import { randomUUID } from "node:crypto";
import { pick, rollFrom, mulberry32, hashString } from "../buddy-engine.js";
import { deleteCollectionEntry, hasCollectionEntryForBuddy, loadCollection, saveToCollection } from "../collection.js";
import { EYES, SPECIES } from "../config.js";
import { clearPendingBuddy, getMaxBuddy, setPendingBuddy } from "../settings-manager.js";
import { applyUuid, backupUuid, hasBackup } from "../uuid-manager.js";
import { syncCollection } from "./state.js";
import { createIdleRollState, ROLL_ACTIONS } from "./roll-config.js";
import { getRarityAccent } from "./render-helpers.js";

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function runRollSequence(state, writeScreen) {
  state.screen = "roll";
  state.busy = true;
  state.statusMessage = "Rolling buddy signal...";
  if (!hasBackup()) {
    backupUuid();
    state.statusMessage = "Backup created before first roll.";
  }
  const buddy = rollFrom(randomUUID());
  const rng = mulberry32(hashString(`${buddy.uuid}:tui-spin`));
  const accent = getRarityAccent(buddy.rarity);
  const collectionFull = loadCollection().length >= getMaxBuddy();

  for (const delay of [45, 55, 65, 75, 90, 105]) {
    state.roll = {
      ...state.roll,
      phase: "spinning",
      previewSpecies: pick(rng, SPECIES),
      previewEye: pick(rng, EYES)
    };
    writeScreen(state);
    await sleep(delay);
  }

  state.roll = {
    ...state.roll,
    phase: "rarity",
    previewRarity: buddy.rarity,
    previewColor: accent.color,
    previewBurst: accent.burst,
    previewStars: accent.stars
  };
  writeScreen(state);
  await sleep(buddy.rarity === "legendary" ? 500 : 300);

  state.roll = {
    ...state.roll,
    phase: "revealed",
    buddy,
    actionIndex: 0,
    previewColor: accent.color,
    previewBurst: accent.burst,
    previewStars: accent.stars,
    savedToCollection: false,
    collectionFull
  };
  setPendingBuddy(buddy);
  state.busy = false;
  state.statusMessage = `Rolled ${buddy.rarity} ${buddy.species}.`;
}

function resetRollState(state) {
  state.roll = createIdleRollState();
}

function ensureRollSaved(state) {
  if (state.roll.savedToCollection || !state.roll.buddy) {
    return null;
  }
  const maxBuddy = getMaxBuddy();
  const collection = loadCollection();
  if (hasCollectionEntryForBuddy(state.roll.buddy)) {
    state.roll.savedToCollection = true;
    state.roll.collectionFull = collection.length >= maxBuddy;
    syncCollection(state);
    return null;
  }
  if (collection.length >= maxBuddy) {
    throw new Error(`Collection full (${collection.length}/${maxBuddy}). Delete a buddy first.`);
  }
  const entry = saveToCollection(state.roll.buddy);
  state.roll.savedToCollection = true;
  state.roll.collectionFull = loadCollection().length >= getMaxBuddy();
  syncCollection(state);
  return entry;
}

export async function applyRollAction(state, writeScreen) {
  const buddy = state.roll.buddy;
  const action = ROLL_ACTIONS[state.roll.actionIndex]?.id;
  if (!buddy) {
    return;
  }
  if (action === "equip") {
    let savedEntry = null;
    try {
      savedEntry = ensureRollSaved(state);
      clearPendingBuddy();
    } catch (error) {
      if (savedEntry) {
        try {
          deleteCollectionEntry(savedEntry);
          state.roll.savedToCollection = false;
          state.roll.collectionFull = loadCollection().length >= getMaxBuddy();
          syncCollection(state);
        } catch (rollbackError) {
          throw new Error(`${error.message} Rollback failed: ${rollbackError.message}`);
        }
      }
      state.statusMessage = error.message;
      return;
    }
    try {
      applyUuid(buddy.uuid);
      state.screen = "home";
      resetRollState(state);
      state.statusMessage = savedEntry
        ? `Collected + equipped ${buddy.species}. Restart Claude Code.`
        : `Equipped ${buddy.species}. Restart Claude Code.`;
      return;
    } catch (error) {
      if (savedEntry) {
        try {
          deleteCollectionEntry(savedEntry);
          setPendingBuddy(buddy);
          state.roll.savedToCollection = false;
          state.roll.collectionFull = loadCollection().length >= getMaxBuddy();
          syncCollection(state);
        } catch (rollbackError) {
          throw new Error(`${error.message} Rollback failed: ${rollbackError.message}`);
        }
      }
      state.statusMessage = error.message;
      return;
    }
  }
  if (action === "add") {
    let savedEntry = null;
    try {
      savedEntry = ensureRollSaved(state);
      clearPendingBuddy();
      state.statusMessage = savedEntry ? "Buddy saved to collection." : "Buddy already saved for this roll.";
    } catch (error) {
      if (savedEntry) {
        try {
          deleteCollectionEntry(savedEntry);
          state.roll.savedToCollection = false;
          state.roll.collectionFull = loadCollection().length >= getMaxBuddy();
          syncCollection(state);
        } catch (rollbackError) {
          throw new Error(`${error.message} Rollback failed: ${rollbackError.message}`);
        }
      }
      state.statusMessage = error.message;
    }
    return;
  }
  if (action === "reroll") {
    await runRollSequence(state, writeScreen);
    return;
  }
  state.screen = "home";
  state.statusMessage = state.roll.savedToCollection ? "Returned home." : "Roll discarded.";
  resetRollState(state);
}
