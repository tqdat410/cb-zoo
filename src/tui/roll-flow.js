import { randomUUID } from "node:crypto";
import { pick, rollFrom, mulberry32, hashString } from "../buddy-engine.js";
import { deleteCollectionEntry, saveToCollection } from "../collection.js";
import { EYES, SPECIES } from "../config.js";
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
    savedToCollection: false
  };
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
  const entry = saveToCollection(state.roll.buddy);
  state.roll.savedToCollection = true;
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
    const savedEntry = ensureRollSaved(state);
    try {
      applyUuid(buddy.uuid);
    } catch (error) {
      if (savedEntry) {
        try {
          deleteCollectionEntry(savedEntry);
          state.roll.savedToCollection = false;
          syncCollection(state);
        } catch (rollbackError) {
          throw new Error(`${error.message} Rollback failed: ${rollbackError.message}`);
        }
      }
      throw error;
    }
    state.screen = "home";
    resetRollState(state);
    state.statusMessage = savedEntry
      ? `Collected + equipped ${buddy.species}. Restart Claude Code.`
      : `Equipped ${buddy.species}. Restart Claude Code.`;
    return;
  }
  if (action === "add") {
    const savedEntry = ensureRollSaved(state);
    state.statusMessage = savedEntry ? "Buddy saved to collection." : "Buddy already saved for this roll.";
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
