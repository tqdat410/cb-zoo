import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createKeypressHandler } from "../src/tui/controller.js";
import { applyRollAction, runRollSequence } from "../src/tui/roll-flow.js";
import { createInitialState, openEdit, syncCollection, syncCurrent } from "../src/tui/state.js";
import { withTempEnvironment } from "../test-support/with-temp-environment.js";

test("controller moves around home and opens edit from current view", async () => {
  await withTempEnvironment(async () => {
    const state = createInitialState();
    const writes = [];
    const handler = createKeypressHandler(state, () => writes.push("render"));

    await handler({ name: "down" });
    assert.equal(state.menuIndex, 1);

    syncCurrent(state);
    state.screen = "current";
    await handler({ name: "text", value: "e" });
    assert.equal(state.screen, "edit");
    assert.equal(state.edit.name, "Plinth");
    assert.ok(writes.length > 0);
  });
});

test("controller saves edit fields through existing update path", async () => {
  await withTempEnvironment(async ({ readConfig }) => {
    const state = createInitialState();
    openEdit(state);
    state.edit.name = "Nova";
    state.edit.personality = "Calm under pressure.";
    const handler = createKeypressHandler(state, () => {});

    await handler({ name: "enter" });

    assert.equal(state.screen, "current");
    assert.equal(readConfig().companion.name, "Nova");
  });
});

test("controller keeps q and hjkl available as text input inside edit mode", async () => {
  await withTempEnvironment(async () => {
    const state = createInitialState();
    openEdit(state);
    state.edit.name = "";
    const handler = createKeypressHandler(state, () => {});

    await handler({ name: "text", value: "q" });
    await handler({ name: "text", value: "h" });
    await handler({ name: "text", value: "j" });
    await handler({ name: "text", value: "k" });
    await handler({ name: "text", value: "l" });

    assert.equal(state.shouldExit, false);
    assert.equal(state.edit.name, "qhjkl");
  });
});

test("roll flow creates backup and stores a revealed buddy", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    const state = createInitialState();
    await runRollSequence(state, () => {});

    assert.equal(state.roll.phase, "revealed");
    assert.equal(state.collectionEntries.length, 1);
    assert.equal(existsSync(join(dataDir, "backup.json")), true);
    assert.equal(existsSync(join(dataDir, "collection.json")), true);
  });
});

test("applyRollAction handles back navigation without mutating UUID", async () => {
  await withTempEnvironment(async ({ readConfig }) => {
    const state = createInitialState();
    await runRollSequence(state, () => {});
    state.roll.actionIndex = 2;

    await applyRollAction(state, () => {});

    assert.equal(state.screen, "home");
    assert.equal(readConfig().oauthAccount.accountUuid, "73e7fce7-9a2a-40b1-b78e-11571f33011a");
  });
});

test("state sync helpers load current buddy and collection data", async () => {
  await withTempEnvironment(async () => {
    const state = createInitialState();
    syncCurrent(state);
    syncCollection(state);

    assert.equal(state.currentCompanion.name, "Plinth");
    assert.deepEqual(state.collectionEntries, []);
  });
});
