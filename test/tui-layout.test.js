import test from "node:test";
import assert from "node:assert/strict";
import { renderHandheldScreen } from "../src/tui/render-layout.js";
import { ANSI, stripAnsi } from "../src/tui/render-helpers.js";
import { renderCollectionView } from "../src/tui/views/collection-view.js";
import { renderCurrentView } from "../src/tui/views/current-view.js";
import { renderEditView } from "../src/tui/views/edit-view.js";
import { renderRollView } from "../src/tui/views/roll-view.js";

function assertIncludes(value, fragment) {
  assert.equal(value.includes(fragment), true);
}

function assertExcludes(value, fragment) {
  assert.equal(value.includes(fragment), false);
}

function getVisibleLineContaining(screen, fragment) {
  return stripAnsi(screen).split("\n").find((line) => line.includes(fragment)) || "";
}

test("renderHandheldScreen includes shell chrome and clips overflow body lines", () => {
  const screen = renderHandheldScreen(
    {
      title: "HOME",
      subtitle: "Roll, inspect, collect, and apply",
      bodyLines: Array.from({ length: 40 }, (_, index) => `Line ${index + 1}`),
      footer: "Footer",
      status: "Ready."
    },
    { columns: 72, rows: 24 }
  );

  assert.match(screen, /CB-ZOO \/\/ BUDDY CONSOLE/);
  assert.match(screen, /HOME/);
  assert.match(screen, /Footer/);
  assert.match(screen, /Ready\./);
  assert.match(screen, /\.\.\./);
  assert.equal(screen.includes(ANSI.bgBlue), false);
});

test("renderHandheldScreen centers the shell on wide terminals", () => {
  const screen = renderHandheldScreen(
    {
      title: "HOME",
      bodyLines: ["One line"]
    },
    { columns: 120, rows: 24 }
  );

  assert.match(screen, /\x1b\[H {23}╭/);
});

test("renderHandheldScreen falls back to default footer and status fields", () => {
  const screen = renderHandheldScreen(
    {
      title: "ROLL",
      bodyLines: ["One line"]
    },
    { columns: 64, rows: 24 }
  );

  assert.match(screen, /Arrows move  Enter confirm  Esc back  Q quit/);
});

test("renderHandheldScreen shows a minimum-size warning on tiny terminals", () => {
  const screen = renderHandheldScreen(
    {
      title: "HOME",
      bodyLines: ["One line"]
    },
    { columns: 50, rows: 20 }
  );

  assert.match(screen, /Terminal too small for cb-zoo\./);
  assert.match(screen, /Need at least 64x24\./);
});

test("minimum-width roll and edit screens stay within the terminal bounds", () => {
  const terminal = { columns: 64, rows: 24 };
  const rollScreen = renderHandheldScreen(
    renderRollView(
      {
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
      },
      terminal
    ),
    terminal
  );
  const editScreen = renderHandheldScreen(
    renderEditView(
      {
        edit: {
          activeField: "name",
          name: "Nova the exceptionally verbose buddy alias from cb-zoo",
          personality: "Calm under pressure.",
          error: ""
        },
        statusMessage: "Editing"
      },
      terminal
    ),
    terminal
  );
  const collectionScreen = renderHandheldScreen(
    renderCollectionView(
      {
        collectionEntries: [
          { species: "cat", rarity: "rare", total: 251, eye: "✦", hat: "crown", shiny: false, rolledAt: "2026-04-02T00:00:00.000Z" }
        ],
        collectionIndex: 0,
        collectionPrompt: { mode: "confirm-delete" },
        statusMessage: "Delete cat from collection?"
      },
      terminal
    ),
    terminal
  );

  for (const screen of [rollScreen, editScreen, collectionScreen]) {
    for (const line of stripAnsi(screen).split("\n")) {
      assert.ok(line.length <= 64);
    }
  }

  assert.doesNotMatch(stripAnsi(collectionScreen), /\.\.\./);
});

test("full-screen collection shell keeps rarity accent in the top bar and title", () => {
  const commonScreen = renderHandheldScreen(
    renderCollectionView(
      {
        collectionEntries: [
          { species: "blob", rarity: "common", total: 88, eye: "·", hat: "none", shiny: false, rolledAt: "2026-04-02T00:00:00.000Z" }
        ],
        collectionIndex: 0,
        collectionPrompt: { mode: "browse" },
        statusMessage: ""
      },
      { columns: 90, rows: 30 }
    ),
    { columns: 90, rows: 30 }
  );
  const epicScreen = renderHandheldScreen(
    renderCollectionView(
      {
        collectionEntries: [
          { species: "ghost", rarity: "epic", total: 399, eye: "✦", hat: "halo", shiny: false, rolledAt: "2026-04-02T00:00:00.000Z" }
        ],
        collectionIndex: 0,
        collectionPrompt: { mode: "browse" },
        statusMessage: ""
      },
      { columns: 90, rows: 30 }
    ),
    { columns: 90, rows: 30 }
  );

  assertIncludes(epicScreen, `${ANSI.bold}${ANSI.epic}CB-ZOO // BUDDY CONSOLE`);
  assertIncludes(epicScreen, `${ANSI.epic}${ANSI.bold}COLLECTION`);
  assertExcludes(commonScreen, `${ANSI.green}${ANSI.bold}COLLECTION`);
});

test("collection keeps the selected epic and legendary accents isolated in mixed shelves", () => {
  const entries = [
    { species: "capybara", rarity: "epic", total: 298, eye: "◎", hat: "tophat", shiny: false, rolledAt: "2026-04-03T00:00:00.000Z" },
    { species: "duck", rarity: "legendary", total: 347, eye: "◎", hat: "beanie", shiny: false, rolledAt: "2026-04-03T00:00:00.000Z" }
  ];
  const terminal = { columns: 90, rows: 30 };
  const epicSelected = renderHandheldScreen(
    renderCollectionView(
      {
        collectionEntries: entries,
        collectionIndex: 0,
        collectionPrompt: { mode: "browse" },
        statusMessage: ""
      },
      terminal
    ),
    terminal
  );
  const legendarySelected = renderHandheldScreen(
    renderCollectionView(
      {
        collectionEntries: entries,
        collectionIndex: 1,
        collectionPrompt: { mode: "browse" },
        statusMessage: ""
      },
      terminal
    ),
    terminal
  );

  assertIncludes(epicSelected, `${ANSI.epic}${ANSI.bold}▶ capybara`);
  assertIncludes(epicSelected, `${ANSI.epic}┌`);
  assertIncludes(epicSelected, `${ANSI.epic}${ANSI.bold}★★★★ EPIC CAPYBARA`);
  assertExcludes(epicSelected, `${ANSI.legendary}${ANSI.bold}★★★★ EPIC CAPYBARA`);

  assertIncludes(legendarySelected, `${ANSI.legendary}${ANSI.bold}▶ duck`);
  assertIncludes(legendarySelected, `${ANSI.legendary}┌`);
  assertIncludes(legendarySelected, `${ANSI.legendary}${ANSI.bold}★★★★★ LEGENDARY DUCK`);
  assertExcludes(legendarySelected, `${ANSI.epic}${ANSI.bold}★★★★★ LEGENDARY DUCK`);
});

test("full-screen current shell keeps legendary and epic accents aligned with the active buddy", () => {
  const epicScreen = renderHandheldScreen(
    renderCurrentView(
      {
        currentCompanion: null,
        currentBuddy: {
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
        },
        statusMessage: ""
      }
    ),
    { columns: 90, rows: 30 }
  );
  const legendaryScreen = renderHandheldScreen(
    renderCurrentView(
      {
        currentCompanion: null,
        currentBuddy: {
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
        },
        statusMessage: ""
      }
    ),
    { columns: 90, rows: 30 }
  );

  assertIncludes(epicScreen, `${ANSI.bold}${ANSI.epic}CB-ZOO // BUDDY CONSOLE`);
  assertIncludes(epicScreen, `${ANSI.epic}${ANSI.bold}CURRENT`);
  assertIncludes(legendaryScreen, `${ANSI.bold}${ANSI.legendary}CB-ZOO // BUDDY CONSOLE`);
  assertIncludes(legendaryScreen, `${ANSI.legendary}${ANSI.bold}CURRENT`);
  assertExcludes(legendaryScreen, `${ANSI.epic}${ANSI.bold}CURRENT`);
});

test("roll, current, and collection center their inner info panels inside the shell", () => {
  const terminal = { columns: 90, rows: 30 };
  const rollScreen = renderHandheldScreen(
    renderRollView(
      {
        roll: {
          phase: "revealed",
          buddy: {
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
          },
          actionIndex: 0,
          previewColor: "",
          previewStars: "★ COMMON",
          savedToCollection: false
        },
        statusMessage: ""
      },
      terminal
    ),
    terminal
  );
  const currentScreen = renderHandheldScreen(
    renderCurrentView(
      {
        currentCompanion: null,
        currentBuddy: {
          uuid: "c1",
          rarity: "epic",
          species: "rabbit",
          eye: "@",
          hat: "tophat",
          shiny: false,
          stats: { DEBUGGING: 41, PATIENCE: 68, CHAOS: 88, WISDOM: 37, SNARK: 59 },
          peak: "CHAOS",
          dump: "WISDOM",
          total: 293
        },
        statusMessage: ""
      },
      terminal
    ),
    terminal
  );
  const collectionScreen = renderHandheldScreen(
    renderCollectionView(
      {
        collectionEntries: [
          { species: "capybara", rarity: "epic", total: 298, eye: "◎", hat: "tophat", shiny: false, rolledAt: "2026-04-03T00:00:00.000Z" }
        ],
        collectionIndex: 0,
        collectionPrompt: { mode: "browse" },
        statusMessage: ""
      },
      terminal
    ),
    terminal
  );

  assert.match(getVisibleLineContaining(rollScreen, "╔"), /│ {8,}╔/);
  assert.match(getVisibleLineContaining(currentScreen, "╔"), /│ {8,}╔/);
  assert.match(getVisibleLineContaining(collectionScreen, "┌"), /│ {8,}┌/);
  assert.match(getVisibleLineContaining(collectionScreen, "Collection"), /│ {8,}Collection/);
});
