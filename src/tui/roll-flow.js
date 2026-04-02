import { randomUUID } from "node:crypto";
import { pick, rollFrom, mulberry32, hashString } from "../buddy-engine.js";
import { saveToCollection } from "../collection.js";
import { EYES, SPECIES } from "../config.js";
import { applyUuid, backupUuid, hasBackup } from "../uuid-manager.js";
import { syncCollection } from "./state.js";
import { ANSI } from "./render-helpers.js";

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function runRollSequence(state, writeScreen) {
  state.screen = "roll";
  state.busy = true;
  state.statusMessage = "Rolling capsule...";
  if (!hasBackup()) {
    backupUuid();
    state.statusMessage = "Backup created before first roll.";
  }
  const buddy = rollFrom(randomUUID());
  const rng = mulberry32(hashString(`${buddy.uuid}:tui-spin`));
  const rarityColors = {
    common: ANSI.gray,
    uncommon: ANSI.green,
    rare: ANSI.cyan,
    epic: ANSI.magenta,
    legendary: ANSI.gold
  };

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
    previewColor: rarityColors[buddy.rarity],
    previewBurst: buddy.rarity === "legendary" ? "✦✦✦✦✦✦✦✦✦✦✦✦" : "★ ★ ★ ★ ★ ★ ★ ★"
  };
  writeScreen(state);
  await sleep(buddy.rarity === "legendary" ? 500 : 300);

  state.roll = { ...state.roll, phase: "revealed", buddy, actionIndex: 0 };
  state.busy = false;
  saveToCollection(buddy);
  syncCollection(state);
  state.statusMessage = "Buddy added to collection.";
}

export async function applyRollAction(state, writeScreen) {
  const buddy = state.roll.buddy;
  const action = ["apply", "reroll", "back"][state.roll.actionIndex];
  if (!buddy) {
    return;
  }
  if (action === "apply") {
    const result = applyUuid(buddy.uuid);
    state.screen = "home";
    state.roll = { ...state.roll, phase: "idle", buddy: null, actionIndex: 0 };
    state.statusMessage = result.warning;
    return;
  }
  if (action === "reroll") {
    await runRollSequence(state, writeScreen);
    return;
  }
  state.screen = "home";
  state.statusMessage = "Roll cancelled.";
  state.roll = { ...state.roll, phase: "idle", buddy: null, actionIndex: 0 };
}
