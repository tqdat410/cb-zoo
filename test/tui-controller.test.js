import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadCollection } from "../src/collection.js";
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

test("roll flow creates backup but does not auto-store a revealed buddy", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    const state = createInitialState();
    await runRollSequence(state, () => {});

    assert.equal(state.roll.phase, "revealed");
    assert.equal(state.collectionEntries.length, 0);
    assert.equal(state.roll.savedToCollection, false);
    assert.equal(existsSync(join(dataDir, "backup.json")), true);
    assert.equal(existsSync(join(dataDir, "collection.json")), false);
  });
});

test("applyRollAction add stores a reveal exactly once", async () => {
  await withTempEnvironment(async () => {
    const state = createInitialState();
    await runRollSequence(state, () => {});
    state.roll.actionIndex = 1;

    await applyRollAction(state, () => {});
    await applyRollAction(state, () => {});

    assert.equal(state.screen, "roll");
    assert.equal(state.roll.savedToCollection, true);
    assert.equal(loadCollection().length, 1);
    assert.equal(state.collectionEntries.length, 1);
  });
});

test("applyRollAction equip stores the reveal and mutates UUID", async () => {
  await withTempEnvironment(async ({ readConfig }) => {
    const state = createInitialState();
    await runRollSequence(state, () => {});
    const rolledUuid = state.roll.buddy.uuid;

    await applyRollAction(state, () => {});

    assert.equal(state.screen, "home");
    assert.equal(loadCollection().length, 1);
    assert.equal(readConfig().oauthAccount.accountUuid, rolledUuid);
  });
});

test("applyRollAction handles back navigation without mutating UUID or collection", async () => {
  await withTempEnvironment(async ({ readConfig }) => {
    const state = createInitialState();
    await runRollSequence(state, () => {});
    state.roll.actionIndex = 3;

    await applyRollAction(state, () => {});

    assert.equal(state.screen, "home");
    assert.equal(loadCollection().length, 0);
    assert.equal(readConfig().oauthAccount.accountUuid, "73e7fce7-9a2a-40b1-b78e-11571f33011a");
  });
});

test("controller supports roll shortcuts, reroll, and escape back", async () => {
  await withTempEnvironment(async () => {
    const state = createInitialState();
    const handler = createKeypressHandler(state, () => {});
    await runRollSequence(state, () => {});
    const firstUuid = state.roll.buddy.uuid;

    await handler({ name: "right" });
    assert.equal(state.roll.actionIndex, 1);

    await handler({ name: "left" });
    assert.equal(state.roll.actionIndex, 0);

    await handler({ name: "text", value: "a" });
    assert.equal(state.roll.savedToCollection, true);
    assert.equal(loadCollection().length, 1);

    await handler({ name: "text", value: "r" });
    assert.equal(state.screen, "roll");
    assert.equal(state.roll.phase, "revealed");
    assert.notEqual(state.roll.buddy.uuid, firstUuid);
    assert.equal(loadCollection().length, 1);

    await handler({ name: "escape" });
    assert.equal(state.screen, "home");
  });
});

test("controller clears busy when roll start fails", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    writeFileSync(join(dataDir, "backup.json"), "{not-json", "utf8");
    const state = createInitialState();
    const handler = createKeypressHandler(state, () => {});

    await handler({ name: "enter" });

    assert.equal(state.screen, "home");
    assert.equal(state.busy, false);
    assert.match(state.statusMessage, /backup exists but is invalid/i);
  });
});

test("equip rollback removes collection entry when apply fails", async () => {
  await withTempEnvironment(async ({ configFile }) => {
    writeFileSync(`${configFile}.tmp`, "placeholder", "utf8");
    const state = createInitialState();
    await runRollSequence(state, () => {});

    await assert.rejects(() => applyRollAction(state, () => {}), /existing temporary file/i);

    assert.equal(state.roll.savedToCollection, false);
    assert.equal(loadCollection().length, 0);
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
