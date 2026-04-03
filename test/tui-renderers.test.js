import test from "node:test";
import assert from "node:assert/strict";
import { normalizeKeypress } from "../src/tui/read-keypress.js";
import { renderHomeView } from "../src/tui/views/home-view.js";
import { renderCollectionView } from "../src/tui/views/collection-view.js";
import { renderCurrentView } from "../src/tui/views/current-view.js";
import { renderEditView } from "../src/tui/views/edit-view.js";
import { renderRollView } from "../src/tui/views/roll-view.js";
import { showBuddyCard } from "../src/gacha-animation.js";
import { formatCompanionSummary } from "../src/companion-state.js";
import { ANSI, clipLines, getRarityAccent, stripAnsi, wrapText } from "../src/tui/render-helpers.js";
import { getRollActionIndex } from "../src/tui/roll-config.js";

function assertIncludes(value, fragment) {
  assert.equal(value.includes(fragment), true);
}

function assertExcludes(value, fragment) {
  assert.equal(value.includes(fragment), false);
}

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
  assert.equal(getRollActionIndex("missing-action"), 0);
});

test("rarity accents match the requested palette matrix", () => {
  assert.equal(getRarityAccent("common").color, "");
  assert.equal(getRarityAccent("uncommon").color, ANSI.green);
  assert.equal(getRarityAccent("rare").color, ANSI.blue);
  assert.equal(getRarityAccent("epic").color, ANSI.epic);
  assert.equal(getRarityAccent("legendary").color, ANSI.legendary);
});

test("home, edit, collection, and roll views render cb-zoo content", () => {
  const home = renderHomeView({ menuIndex: 0, statusMessage: "Ready." }, { columns: 90, rows: 30 });
  assert.match(home.bodyLines.join("\n"), /Roll, collect, and apply Claude buddies\./);

  const edit = renderEditView({
    edit: { activeField: "name", name: "Nova", personality: "Calm under pressure.", error: "", confirmReset: false },
    statusMessage: "Editing"
  }, { columns: 90, rows: 30 });
  assert.match(edit.bodyLines.join("\n"), /Name: Nova/);
  assert.match(edit.footer, /R reset/);

  const collection = renderCollectionView({
    collectionEntries: [
      { species: "cat", rarity: "rare", total: 251, eye: "✦", hat: "crown", shiny: false, rolledAt: "2026-04-02T00:00:00.000Z" }
    ],
    collectionIndex: 0,
    collectionPrompt: { mode: "browse" },
    statusMessage: "Shelf"
  }, { columns: 90, rows: 30 });
  assert.match(collection.bodyLines.join("\n"), /Collection/);
  assert.match(collection.bodyLines.join("\n"), /RARE CAT/);
  assert.match(collection.footer, /Enter\/A apply/);
  assert.match(collection.bodyLines.join("\n"), /\x1b\[34m/);

  const current = renderCurrentView({
    currentCompanion: {
      name: "Plinth",
      uuid: "73e7fce7-9a2a-40b1-b78e-11571f33011a",
      species: "cat",
      personality: "A methodical tabby that paces when you introduce a bug.",
      hatchedAt: 1775023802769
    },
    currentBuddy: null,
    statusMessage: "Current"
  });
  assert.match(current.bodyLines.join("\n"), /\x1b\[34m/);
  assert.match(current.bodyLines.join("\n"), /Shiny: no/);

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
      actionIndex: 0,
      previewColor: "\x1b[36m",
      previewStars: "★★★",
      savedToCollection: false
    },
    statusMessage: "Rolled."
  }, { columns: 90, rows: 30 });
  assert.match(roll.bodyLines.join("\n"), /Equip/);
  assert.match(roll.bodyLines.join("\n"), /Add/);
  assert.match(roll.bodyLines.join("\n"), /Reroll/);
  assert.match(roll.bodyLines.join("\n"), /collection only/);
  assert.match(roll.bodyLines.join("\n"), /Shiny: no/);
  assert.match(stripAnsi(roll.bodyLines[1]), /╔/);

  const savedRoll = renderRollView({
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
      actionIndex: 1,
      previewColor: "\x1b[36m",
      previewStars: "★★★",
      savedToCollection: true
    },
    statusMessage: "Saved."
  }, { columns: 90, rows: 30 });
  assert.match(savedRoll.bodyLines.join("\n"), /\x1b\[32m/);

  const fullRoll = renderRollView({
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
      actionIndex: 0,
      previewColor: "\x1b[36m",
      previewStars: "★★★",
      savedToCollection: false,
      collectionFull: true
    },
    statusMessage: "Collection full."
  }, { columns: 90, rows: 30 });
  assert.match(fullRoll.bodyLines.join("\n"), /Collection full/);
  assert.match(fullRoll.bodyLines.join("\n"), /Equip - full/);
  assert.match(fullRoll.footer, /R reroll/);
});

test("edit view swaps to reset confirmation copy when requested", () => {
  const confirmView = renderEditView({
    edit: { activeField: "name", name: "Nova", personality: "Calm under pressure.", error: "", confirmReset: true },
    statusMessage: "Reset companion profile and let Claude regenerate it?"
  }, { columns: 90, rows: 30 });

  assert.match(confirmView.bodyLines.join("\n"), /Reset companion profile\?/);
  assert.match(confirmView.bodyLines.join("\n"), /Current UUID stays unchanged\./);
  assert.equal(confirmView.footer, "Enter/Y reset  Esc/N cancel");
});

test("collection confirm-delete view swaps to prompt footer", () => {
  const collection = renderCollectionView({
    collectionEntries: [
      { species: "cat", rarity: "rare", total: 251, eye: "✦", hat: "crown", shiny: false, rolledAt: "2026-04-02T00:00:00.000Z" }
    ],
    collectionIndex: 0,
    collectionPrompt: { mode: "confirm-delete" },
    statusMessage: "Delete cat?"
  }, { columns: 90, rows: 30 });

  assert.match(collection.bodyLines.join("\n"), /Delete cat from collection\?/);
  assert.equal(collection.footer, "Enter/Y delete  Esc/N cancel");
});

test("collection rows and detail boxes use the rarity accent consistently", () => {
  const epicCollection = renderCollectionView({
    collectionEntries: [
      { species: "ghost", rarity: "epic", total: 399, eye: "✦", hat: "halo", shiny: false, rolledAt: "2026-04-02T00:00:00.000Z" }
    ],
    collectionIndex: 0,
    collectionPrompt: { mode: "browse" },
    statusMessage: ""
  }, { columns: 90, rows: 30 });
  const legendaryCollection = renderCollectionView({
    collectionEntries: [
      { species: "dragon", rarity: "legendary", total: 501, eye: "@", hat: "crown", shiny: true, rolledAt: "2026-04-02T00:00:00.000Z" }
    ],
    collectionIndex: 0,
    collectionPrompt: { mode: "browse" },
    statusMessage: ""
  }, { columns: 90, rows: 30 });
  const uncommonCollection = renderCollectionView({
    collectionEntries: [
      { species: "duck", rarity: "uncommon", total: 188, eye: "·", hat: "none", shiny: false, rolledAt: "2026-04-02T00:00:00.000Z" }
    ],
    collectionIndex: 0,
    collectionPrompt: { mode: "browse" },
    statusMessage: ""
  }, { columns: 90, rows: 30 });
  const commonCollection = renderCollectionView({
    collectionEntries: [
      { species: "blob", rarity: "common", total: 88, eye: "·", hat: "none", shiny: false, rolledAt: "2026-04-02T00:00:00.000Z" }
    ],
    collectionIndex: 0,
    collectionPrompt: { mode: "browse" },
    statusMessage: ""
  }, { columns: 90, rows: 30 });

  assertIncludes(epicCollection.bodyLines.join("\n"), ANSI.epic);
  assertIncludes(legendaryCollection.bodyLines.join("\n"), ANSI.legendary);
  assertIncludes(uncommonCollection.bodyLines.join("\n"), ANSI.green);
  assertExcludes(commonCollection.bodyLines.join("\n"), ANSI.green);
});

test("reveal and stored-current cards keep epic and legendary text on the same rarity accent as the frame", () => {
  const epicBuddy = {
    uuid: "u2",
    rarity: "epic",
    species: "ghost",
    eye: "✦",
    hat: "halo",
    shiny: false,
    stats: { DEBUGGING: 90, PATIENCE: 90, CHAOS: 90, WISDOM: 90, SNARK: 90 },
    peak: "DEBUGGING",
    dump: "CHAOS",
    total: 450
  };
  const legendaryBuddy = {
    uuid: "u3",
    rarity: "legendary",
    species: "dragon",
    eye: "@",
    hat: "crown",
    shiny: true,
    stats: { DEBUGGING: 95, PATIENCE: 95, CHAOS: 95, WISDOM: 95, SNARK: 95 },
    peak: "WISDOM",
    dump: "CHAOS",
    total: 475
  };
  const epicCard = showBuddyCard(epicBuddy, { useAnsi: true });
  const legendaryCard = showBuddyCard(legendaryBuddy, { useAnsi: true });
  const epicCurrent = formatCompanionSummary({
    name: "Nova",
    uuid: "fe41c2c8-6751-4ab3-a50c-0647028d6a29",
    species: "snail",
    personality: "Keeps the logs clean.",
    hatchedAt: 1775023802769
  }, { useAnsi: true });
  const legendaryCurrent = formatCompanionSummary({
    name: "Aster",
    uuid: "157f38b4-701d-4a30-956d-fa4a8c75ff6f",
    species: "octopus",
    personality: "Shows up when the stakes spike.",
    hatchedAt: 1775023802769
  }, { useAnsi: true });

  assertIncludes(epicCard, `${ANSI.epic}╔`);
  assertIncludes(epicCard, `${ANSI.epic} Eyes:`);
  assertIncludes(epicCard, "Shiny: no");
  assertIncludes(epicCard, `${ANSI.epic} Total:`);
  assertExcludes(epicCard, `${ANSI.legendary}╔`);
  assertIncludes(legendaryCard, `${ANSI.legendary}╔`);
  assertIncludes(legendaryCard, `${ANSI.legendary} Eyes:`);
  assertIncludes(legendaryCard, "Shiny: yes");
  assertIncludes(legendaryCard, `${ANSI.legendary} Total:`);
  assertExcludes(legendaryCard, `${ANSI.epic}╔`);

  assertIncludes(epicCurrent, `${ANSI.epic}╔`);
  assertIncludes(epicCurrent, `${ANSI.epic} Nova`);
  assert.match(epicCurrent, /Shiny: (yes|no)/);
  assertIncludes(epicCurrent, `${ANSI.epic} Bones regenerated from current UUID`);
  assertExcludes(epicCurrent, `${ANSI.legendary}╔`);
  assertIncludes(legendaryCurrent, `${ANSI.legendary}╔`);
  assertIncludes(legendaryCurrent, `${ANSI.legendary} Aster`);
  assert.match(legendaryCurrent, /Shiny: (yes|no)/);
  assertIncludes(legendaryCurrent, `${ANSI.legendary} Bones regenerated from current UUID`);
  assertExcludes(legendaryCurrent, `${ANSI.epic}╔`);
});

test("buddy cards keep top and bottom borders aligned with body width", () => {
  const rollCard = showBuddyCard({
    uuid: "r1",
    rarity: "common",
    species: "duck",
    eye: "·",
    hat: "none",
    shiny: false,
    stats: { DEBUGGING: 1, PATIENCE: 69, CHAOS: 30, WISDOM: 44, SNARK: 10 },
    peak: "PATIENCE",
    dump: "DEBUGGING",
    total: 154
  }, { useAnsi: true });
  const currentCard = formatCompanionSummary({
    name: "Aster",
    uuid: "157f38b4-701d-4a30-956d-fa4a8c75ff6f",
    species: "octopus",
    personality: "Shows up when the stakes spike.",
    hatchedAt: 1775023802769
  }, { useAnsi: true });

  for (const card of [rollCard, currentCard]) {
    const visibleLengths = card.split("\n").map((line) => stripAnsi(line).length);
    assert.deepEqual(new Set(visibleLengths).size, 1);
  }
});
