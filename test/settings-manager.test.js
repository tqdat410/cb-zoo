import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  clearPendingBuddy,
  getBackupData,
  getMaxBuddy,
  getPendingBuddy,
  loadSettings,
  saveSettings,
  setBackupData,
  setPendingBuddy
} from "../src/settings-manager.js";
import { withTempEnvironment } from "../test-support/with-temp-environment.js";

const PENDING_BUDDY = {
  uuid: "11111111-1111-4111-8111-111111111111",
  species: "robot",
  rarity: "rare",
  eye: "✦",
  hat: "crown",
  shiny: false,
  total: 260
};

test("loadSettings returns defaults when no settings file exists", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    assert.deepEqual(loadSettings(), { backup: null, maxBuddy: 50, pendingBuddy: null });
    assert.equal(existsSync(join(dataDir, "settings.json")), false);
  });
});

test("loadSettings fills missing settings fields with defaults", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    writeFileSync(join(dataDir, "settings.json"), JSON.stringify({ maxBuddy: 12 }, null, 2), "utf8");

    assert.deepEqual(loadSettings(), { backup: null, maxBuddy: 12, pendingBuddy: null });
  });
});

test("loadSettings migrates legacy backup.json into settings.json", async () => {
  await withTempEnvironment(async ({ dataDir, configFile }) => {
    const backupFile = join(dataDir, "backup.json");
    writeFileSync(
      backupFile,
      JSON.stringify(
        {
          uuid: "22222222-2222-4222-8222-222222222222",
          stateFile: configFile,
          backedUpAt: "2026-04-03T12:00:00.000Z"
        },
        null,
        2
      ),
      "utf8"
    );

    const settings = loadSettings();

    assert.equal(settings.backup.uuid, "22222222-2222-4222-8222-222222222222");
    assert.equal(settings.maxBuddy, 50);
    assert.equal(settings.pendingBuddy, null);
    assert.equal(existsSync(backupFile), false);
    assert.equal(existsSync(join(dataDir, "settings.json")), true);
  });
});

test("settings accessors round-trip backup and pending buddy data", async () => {
  await withTempEnvironment(async ({ configFile }) => {
    setBackupData({
      uuid: "33333333-3333-4333-8333-333333333333",
      stateFile: configFile,
      backedUpAt: "2026-04-03T12:00:00.000Z"
    });
    setPendingBuddy(PENDING_BUDDY);

    assert.equal(getBackupData().uuid, "33333333-3333-4333-8333-333333333333");
    assert.equal(getMaxBuddy(), 50);
    assert.equal(getPendingBuddy().species, "robot");
    assert.equal(typeof getPendingBuddy().rolledAt, "string");

    clearPendingBuddy();
    assert.equal(getPendingBuddy(), null);
  });
});

test("loadSettings drops invalid pendingBuddy payloads", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    writeFileSync(
      join(dataDir, "settings.json"),
      JSON.stringify(
        {
          backup: null,
          maxBuddy: 50,
          pendingBuddy: { uuid: "not-a-uuid" }
        },
        null,
        2
      ),
      "utf8"
    );

    assert.equal(loadSettings().pendingBuddy, null);
  });
});

test("pending mutators fail closed when settings contain an invalid backup", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    const settingsFile = join(dataDir, "settings.json");
    writeFileSync(
      settingsFile,
      JSON.stringify(
        {
          backup: { uuid: "not-a-uuid" },
          maxBuddy: 50,
          pendingBuddy: null
        },
        null,
        2
      ),
      "utf8"
    );

    assert.throws(() => setPendingBuddy(PENDING_BUDDY), /valid UUID/i);
    assert.equal(JSON.parse(readFileSync(settingsFile, "utf8")).backup.uuid, "not-a-uuid");
  });
});

test("saveSettings rejects a stale temporary settings file", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    const tempFile = join(dataDir, "settings.json.tmp");
    writeFileSync(tempFile, "placeholder", "utf8");

    assert.throws(() => saveSettings({ backup: null, maxBuddy: 50, pendingBuddy: null }), /existing temporary file/i);
    assert.equal(readFileSync(tempFile, "utf8"), "placeholder");
  });
});
