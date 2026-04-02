import test from "node:test";
import assert from "node:assert/strict";
import { normalizeKeypress } from "../src/tui/read-keypress.js";
import { renderHomeView } from "../src/tui/views/home-view.js";
import { renderCollectionView } from "../src/tui/views/collection-view.js";
import { renderEditView } from "../src/tui/views/edit-view.js";
import { renderRollView } from "../src/tui/views/roll-view.js";
import { clipLines, wrapText } from "../src/tui/render-helpers.js";

test("normalizeKeypress maps vim aliases and printable input", () => {
  assert.deepEqual(normalizeKeypress("j"), { name: "text", value: "j" });
  assert.deepEqual(normalizeKeypress("k"), { name: "text", value: "k" });
  assert.deepEqual(normalizeKeypress("x"), { name: "text", value: "x" });
  assert.deepEqual(normalizeKeypress("", { name: "return" }), { name: "enter" });
});

test("render helpers wrap and clip text predictably", () => {
  assert.deepEqual(wrapText("alpha beta gamma", 10), ["alpha beta", "gamma"]);
  assert.deepEqual(wrapText("superlongtoken", 5), ["super", "longt", "oken"]);
  assert.deepEqual(clipLines(["a", "b", "c"], 2), ["a", "..."]);
});

test("home, edit, collection, and roll views render handheld content", () => {
  const home = renderHomeView({ menuIndex: 0, statusMessage: "Ready." });
  assert.match(home.bodyLines.join("\n"), /Pokemon-style capsule buddy machine/);

  const edit = renderEditView({
    edit: { activeField: "name", name: "Nova", personality: "Calm under pressure.", error: "" },
    statusMessage: "Editing"
  });
  assert.match(edit.bodyLines.join("\n"), /Name: Nova/);

  const collection = renderCollectionView({
    collectionEntries: [
      { species: "cat", rarity: "rare", total: 251, eye: "✦", hat: "crown", shiny: false, rolledAt: "2026-04-02T00:00:00.000Z" }
    ],
    collectionIndex: 0,
    statusMessage: "Shelf"
  });
  assert.match(collection.bodyLines.join("\n"), /Buddy Detail/);

  const roll = renderRollView({
    roll: {
      phase: "revealed",
      buddy: {
        uuid: "73e7fce7-9a2a-40b1-b78e-11571f33011a",
        rarity: "rare",
        species: "cat",
        eye: "✦",
        hat: "crown",
        shiny: false,
        stats: { DEBUGGING: 61, PATIENCE: 88, CHAOS: 18, WISDOM: 49, SNARK: 45 },
        peak: "PATIENCE",
        dump: "CHAOS",
        total: 261
      },
      actionIndex: 0
    },
    statusMessage: "Rolled."
  });
  assert.match(roll.bodyLines.join("\n"), /Apply/);
});
