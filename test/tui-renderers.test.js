import test from "node:test";
import assert from "node:assert/strict";
import { normalizeKeypress } from "../src/tui/read-keypress.js";
import { renderHomeView } from "../src/tui/views/home-view.js";
import { renderCollectionView } from "../src/tui/views/collection-view.js";
import { renderCurrentView } from "../src/tui/views/current-view.js";
import { renderEditView } from "../src/tui/views/edit-view.js";
import { renderRollView } from "../src/tui/views/roll-view.js";
import { renderBreedConfirm, renderBreedSelectA, renderBreedSelectB, renderBreedSlotSelect } from "../src/tui/views/breed-view.js";
import { renderEggView, renderHatchView } from "../src/tui/views/egg-view.js";
import { showBuddyCard } from "../src/gacha-animation.js";
import { formatCompanionSummary } from "../src/companion-state.js";
import { ANSI, centerVisible, clipLines, getRarityAccent, stripAnsi, wrapText } from "../src/tui/render-helpers.js";
import { getRollActionIndex } from "../src/tui/roll-config.js";
import { clearBreedEgg, saveSettings, setBreedEgg } from "../src/settings-manager.js";
import { withTempEnvironment } from "../test-support/with-temp-environment.js";

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

test("home, edit, collection, and roll views render cb-zoo content", async () => {
  await withTempEnvironment(async () => {
    const home = renderHomeView({ menuIndex: 0, statusMessage: "Ready." }, { columns: 90, rows: 30 });
    const selectedHomeLine = home.bodyLines.find((line) => stripAnsi(line).includes("Roll Buddy")) || "";
    assert.match(home.bodyLines.join("\n"), /Roll, breed, and collect Claude buddies\./);
    assert.match(home.bodyLines.join("\n"), /Equip, hatch, and manage them here\./);
    assert.match(home.topRight, /0\/50 \| 100\/100 \| --:--/);
    assert.equal(
      stripAnsi(selectedHomeLine),
      stripAnsi(centerVisible(`${ANSI.gold}${ANSI.bold}▶ Roll Buddy${ANSI.reset}`, 70))
    );

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
});

test("home and roll views show charge countdown when rerolls are empty", async () => {
  await withTempEnvironment(async () => {
    saveSettings({
      backup: null,
      maxBuddy: 50,
      rollConfig: { maxCharges: 5, regenMs: 300_000 },
      rollCharges: { available: 0, updatedAt: Date.now() },
      pendingBuddy: null,
      breedEgg: null
    });

    const home = renderHomeView({ menuIndex: 0, statusMessage: "Ready." }, { columns: 90, rows: 30 });
    assert.match(home.topRight, /0\/50 \| 0\/5 \| 05:00/);

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
        actionIndex: 2,
        previewColor: "\x1b[36m",
        previewStars: "★★★",
        savedToCollection: false,
        collectionFull: false
      },
      statusMessage: "No rerolls."
    }, { columns: 90, rows: 30 });

    assert.match(roll.bodyLines.join("\n"), /No rerolls left\. Next \+1 in 05:00\./);
    assert.match(roll.bodyLines.join("\n"), /Reroll - empty/);
    assert.doesNotMatch(roll.footer, /R reroll/);
    assert.match(roll.topRight, /0\/50 \| 0\/5 \| 05:00/);
  });
});

test("home menu centers each option row independently", async () => {
  await withTempEnvironment(async () => {
    const home = renderHomeView({ menuIndex: 3, statusMessage: "Ready." }, { columns: 90, rows: 30 });
    const selectedLine = home.bodyLines.find((line) => stripAnsi(line).trim() === "▶ Breed Buddy") || "";
    const plainLine = home.bodyLines.find((line) => stripAnsi(line).includes("Collection")) || "";

    assert.equal(stripAnsi(selectedLine), stripAnsi(centerVisible(`${ANSI.gold}${ANSI.bold}▶ Breed Buddy${ANSI.reset}`, 70)));
    assert.equal(stripAnsi(plainLine), centerVisible("Collection", 70));
  });
});

test("breed and egg views render parent selection and hatch content", () => {
  const slotSelect = renderBreedSlotSelect({
    breed: {
      phase: "slot-select",
      slots: [
        null,
        {
          parentA: "11111111-1111-4111-8111-111111111111",
          parentB: "22222222-2222-4222-8222-222222222222",
          species: "goose",
          rarity: "uncommon",
          eye: "✦",
          hat: "none",
          shiny: false,
          createdAt: Date.now(),
          hatchAt: Date.now() + 30_000
        }
      ],
      selectIndex: 1
    },
    statusMessage: "Choose a breed slot."
  }, { columns: 90, rows: 30 });
  assert.equal(slotSelect.subtitle, "Choose a breed slot.");
  assert.match(slotSelect.bodyLines.join("\n"), /Slot 2/);
  assert.match(slotSelect.bodyLines.join("\n"), /incubating/);

  const selectA = renderBreedSelectA({
    breed: {
      phase: "select-a",
      slotIndex: 0,
      options: [
        {
          entry: { species: "cat", rarity: "rare", total: 251, eye: "✦", hat: "crown", shiny: false }
        }
      ],
      selectIndex: 0
    },
    statusMessage: "Choose the first parent."
  }, { columns: 90, rows: 30 });
  assert.equal(selectA.subtitle, "Slot 1  Choose the first buddy.");
  assert.match(selectA.bodyLines.join("\n"), /RARE CAT/);
  assert.match(selectA.bodyLines.join("\n"), /Eyes: ✦  Hat: crown/);
  assert.doesNotMatch(selectA.bodyLines.join("\n"), /Choose the first buddy/);

  const selectB = renderBreedSelectB({
    breed: {
      phase: "select-b",
      slotIndex: 0,
      parentA: { species: "cat", rarity: "rare", eye: "✦", hat: "crown" },
      options: [
        {
          entry: { species: "duck", rarity: "common", total: 154, eye: "·", hat: "none", shiny: false }
        }
      ],
      selectIndex: 0
    },
    statusMessage: "Choose the second parent."
  }, { columns: 90, rows: 30 });
  assert.match(selectB.subtitle, /Slot 1/);
  assert.match(selectB.subtitle, /← Back/);
  assert.match(selectB.subtitle, /A: CAT rare/);
  assertIncludes(selectB.subtitle, ANSI.blue);
  assert.match(selectB.bodyLines.join("\n"), /COMMON DUCK/);
  assert.doesNotMatch(selectB.bodyLines.join("\n"), /Parent A locked/);
  assert.match(selectB.footer, /←\/Esc back/);

  const confirm = renderBreedConfirm({
    breed: {
      phase: "confirm",
      slotIndex: 0,
      parentA: { species: "cat", rarity: "rare", eye: "✦", hat: "crown", shiny: false, total: 251 },
      parentB: { species: "duck", rarity: "uncommon", eye: "·", hat: "none", shiny: false, total: 154 }
    },
    statusMessage: "Confirm the pairing."
  }, { columns: 90, rows: 30 });
  assert.match(confirm.subtitle, /Slot 1/);
  assert.match(confirm.subtitle, /← Back/);
  assert.match(confirm.subtitle, /A: CAT rare/);
  assert.match(confirm.subtitle, /B: DUCK uncommon/);
  assertIncludes(confirm.subtitle, ANSI.blue);
  assertIncludes(confirm.subtitle, ANSI.green);
  assert.match(confirm.bodyLines.join("\n"), /RARE CAT/);
  assert.match(confirm.bodyLines.join("\n"), /UNCOMMON DUCK/);
  assert.match(confirm.bodyLines.join("\n"), /×/);
  assert.doesNotMatch(confirm.bodyLines.join("\n"), /GOOSE/);
  assert.doesNotMatch(confirm.bodyLines.join("\n"), /Breed these two buddies\?/);
  assert.match(confirm.footer, /Enter breed  ←\/Esc back/);

  const egg = renderEggView({
    breed: {
      slotIndex: 0,
      egg: {
        parentA: "11111111-1111-4111-8111-111111111111",
        parentB: "22222222-2222-4222-8222-222222222222",
        species: "goose",
        rarity: "uncommon",
        eye: "✦",
        hat: "none",
        hatchAt: Date.now() + 30_000
      },
      parentA: { species: "cat" },
      parentB: { species: "duck" }
    },
    statusMessage: "Incubating"
  }, { columns: 90, rows: 30 });
  assert.match(egg.subtitle, /Slot 1/);
  assert.match(egg.bodyLines.join("\n"), /Lineage: cat × duck/);
  assert.match(egg.bodyLines.join("\n"), /Hatching in/);

  const hatch = renderHatchView({
    breed: {
      slotIndex: 0,
      hatchedBuddy: {
        species: "goose",
        rarity: "uncommon",
        eye: "✦",
        hat: "none",
        shiny: false,
        total: 188,
        stats: { DEBUGGING: 42, PATIENCE: 55, CHAOS: 19, WISDOM: 37, SNARK: 35 },
        peak: "PATIENCE",
        dump: "CHAOS"
      },
      hatchActionIndex: 0,
      collectionFull: false,
      egg: {
        parentA: "11111111-1111-4111-8111-111111111111",
        parentB: "22222222-2222-4222-8222-222222222222"
      },
      parentA: { species: "cat" },
      parentB: { species: "duck" }
    },
    statusMessage: "Ready"
  }, { columns: 90, rows: 30 });
  assert.match(hatch.subtitle, /Slot 1/);
  assert.match(hatch.bodyLines.join("\n"), /EGG HATCHED/);
  assert.match(hatch.bodyLines.join("\n"), /Bred from cat × duck/);
  assert.match(hatch.bodyLines.join("\n"), /DEBUGGING/);
  assert.match(hatch.bodyLines.join("\n"), /Total:/);
  assertIncludes(hatch.bodyLines.join("\n"), ANSI.green);
  assert.match(hatch.bodyLines.join("\n"), /Equip = save \+ apply/);
  assert.match(hatch.footer, /E equip  A add  D discard/);

  const fullHatch = renderHatchView({
    breed: {
      slotIndex: 0,
      hatchedBuddy: {
        species: "goose",
        rarity: "uncommon",
        eye: "✦",
        hat: "none",
        shiny: false,
        total: 188,
        stats: { DEBUGGING: 42, PATIENCE: 55, CHAOS: 19, WISDOM: 37, SNARK: 35 },
        peak: "PATIENCE",
        dump: "CHAOS"
      },
      hatchActionIndex: 1,
      collectionFull: true,
      egg: {
        parentA: "11111111-1111-4111-8111-111111111111",
        parentB: "22222222-2222-4222-8222-222222222222"
      },
      parentA: { species: "cat" },
      parentB: { species: "duck" }
    },
    statusMessage: "Collection full"
  }, { columns: 90, rows: 30 });
  assert.match(fullHatch.bodyLines.join("\n"), /Add and equip are blocked/);
  assert.match(fullHatch.bodyLines.join("\n"), /Add - full/);
  assert.match(fullHatch.footer, /D discard/);
});

test("home view summarizes slot state while keeping a stable breed label", async () => {
  await withTempEnvironment(async () => {
    setBreedEgg({
      parentA: "11111111-1111-4111-8111-111111111111",
      parentB: "22222222-2222-4222-8222-222222222222",
      species: "goose",
      rarity: "uncommon",
      eye: "✦",
      hat: "none",
      shiny: false,
      createdAt: Date.now(),
      hatchAt: Date.now() + 60_000
    });
    const incubating = renderHomeView({ menuIndex: 3, statusMessage: "" }, { columns: 90, rows: 30 });
    assert.match(incubating.bodyLines.join("\n"), /Breed slots: 0 ready \| 1 incubating \| 2 empty/);
    assert.match(incubating.bodyLines.join("\n"), /▶ Breed Buddy/);

    setBreedEgg({
      parentA: "11111111-1111-4111-8111-111111111111",
      parentB: "22222222-2222-4222-8222-222222222222",
      species: "goose",
      rarity: "uncommon",
      eye: "✦",
      hat: "none",
      shiny: false,
      createdAt: Date.now() - 60_000,
      hatchAt: Date.now() - 1_000
    });
    const ready = renderHomeView({ menuIndex: 3, statusMessage: "" }, { columns: 90, rows: 30 });
    assert.match(ready.bodyLines.join("\n"), /Breed slots: 1 ready \| 0 incubating \| 2 empty/);
    assert.match(ready.bodyLines.join("\n"), /▶ Breed Buddy/);
    clearBreedEgg();
  });
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
  assert.match(stripAnsi(legendaryCollection.bodyLines.join("\n")), /dragon\s+legendary\s+501 ✦/);
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
