import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  clearPendingBuddy,
  clearBreedEgg,
  DEFAULT_MAX_ROLL_CHARGES,
  DEFAULT_ROLL_REGEN_MS,
  getBackupData,
  getBreedEgg,
  getMaxBuddy,
  getPendingBuddy,
  getRollCharges,
  getRollConfig,
  isEggReady,
  loadSettings,
  saveSettings,
  setBackupData,
  setBreedEgg,
  setPendingBuddy
} from "../src/settings-manager.js";
import { loadCollection, saveToCollection } from "../src/collection.js";
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

const BREED_EGG = {
  parentA: "22222222-2222-4222-8222-222222222222",
  parentB: "33333333-3333-4333-8333-333333333333",
  species: "dragon",
  rarity: "epic",
  eye: "◉",
  hat: "wizard",
  shiny: false,
  createdAt: 1_700_000_000_000,
  hatchAt: 1_700_000_120_000
};

test("loadSettings returns defaults when no settings file exists", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    const settings = loadSettings();
    assert.equal(settings.backup, null);
    assert.equal(settings.maxBuddy, 50);
    assert.deepEqual(settings.rollConfig, { maxCharges: DEFAULT_MAX_ROLL_CHARGES, regenMs: DEFAULT_ROLL_REGEN_MS });
    assert.equal(settings.rollCharges.available, DEFAULT_MAX_ROLL_CHARGES);
    assert.equal(typeof settings.rollCharges.updatedAt, "number");
    assert.equal(settings.pendingBuddy, null);
    assert.equal(settings.breedEgg, null);
    assert.equal(existsSync(join(dataDir, "settings.json")), false);
  });
});

test("loadSettings fills missing settings fields with defaults", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    writeFileSync(join(dataDir, "settings.json"), JSON.stringify({ maxBuddy: 12 }, null, 2), "utf8");

    const settings = loadSettings();
    assert.equal(settings.backup, null);
    assert.equal(settings.maxBuddy, 12);
    assert.deepEqual(settings.rollConfig, { maxCharges: DEFAULT_MAX_ROLL_CHARGES, regenMs: DEFAULT_ROLL_REGEN_MS });
    assert.equal(settings.rollCharges.available, DEFAULT_MAX_ROLL_CHARGES);
    assert.equal(settings.pendingBuddy, null);
    assert.equal(settings.breedEgg, null);
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
    assert.deepEqual(settings.rollConfig, { maxCharges: DEFAULT_MAX_ROLL_CHARGES, regenMs: DEFAULT_ROLL_REGEN_MS });
    assert.equal(settings.rollCharges.available, DEFAULT_MAX_ROLL_CHARGES);
    assert.equal(settings.pendingBuddy, null);
    assert.equal(settings.breedEgg, null);
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
    assert.deepEqual(getRollConfig(), { maxCharges: DEFAULT_MAX_ROLL_CHARGES, regenMs: DEFAULT_ROLL_REGEN_MS });
    assert.equal(getRollCharges().available, DEFAULT_MAX_ROLL_CHARGES);
    assert.equal(getPendingBuddy().species, "robot");
    assert.equal(typeof getPendingBuddy().rolledAt, "string");

    clearPendingBuddy();
    assert.equal(getPendingBuddy(), null);
  });
});

test("breed egg accessors round-trip egg data", async () => {
  await withTempEnvironment(async () => {
    const egg = {
      ...BREED_EGG,
      hatchAt: Date.now() + 60_000,
      hatchedUuid: "44444444-4444-4444-8444-444444444444"
    };
    setBreedEgg(egg);

    assert.equal(getBreedEgg().species, "dragon");
    assert.equal(getBreedEgg().hatchedUuid, egg.hatchedUuid);
    assert.equal(isEggReady(), false);

    setBreedEgg({ ...egg, hatchAt: Date.now() - 1_000 });
    assert.equal(isEggReady(), true);

    clearBreedEgg();
    assert.equal(getBreedEgg(), null);
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

test("loadSettings defaults invalid roll config and roll charges", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    writeFileSync(
      join(dataDir, "settings.json"),
      JSON.stringify(
        {
          backup: null,
          maxBuddy: 50,
          rollConfig: { maxCharges: -1, regenMs: 0 },
          rollCharges: { available: "bad", updatedAt: "bad" },
          pendingBuddy: null,
          breedEgg: null
        },
        null,
        2
      ),
      "utf8"
    );

    const settings = loadSettings();
    assert.deepEqual(settings.rollConfig, { maxCharges: DEFAULT_MAX_ROLL_CHARGES, regenMs: DEFAULT_ROLL_REGEN_MS });
    assert.equal(settings.rollCharges.available, DEFAULT_MAX_ROLL_CHARGES);
    assert.equal(typeof settings.rollCharges.updatedAt, "number");
  });
});

test("loadSettings drops invalid breedEgg payloads", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    writeFileSync(
      join(dataDir, "settings.json"),
      JSON.stringify(
        {
          backup: null,
          maxBuddy: 50,
          pendingBuddy: null,
          breedEgg: { parentA: "not-a-uuid" }
        },
        null,
        2
      ),
      "utf8"
    );

    assert.equal(loadSettings().breedEgg, null);
  });
});

test("loadSettings drops breedEgg payloads with invalid cosmetics or duplicate parents", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    writeFileSync(
      join(dataDir, "settings.json"),
      JSON.stringify(
        {
          backup: null,
          maxBuddy: 50,
          pendingBuddy: null,
          breedEgg: {
            ...BREED_EGG,
            parentB: BREED_EGG.parentA,
            eye: "?",
            hat: "invalid-hat"
          }
        },
        null,
        2
      ),
      "utf8"
    );

    assert.equal(loadSettings().breedEgg, null);
  });
});

test("loadSettings drops impossible common eggs with a non-none hat", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    writeFileSync(
      join(dataDir, "settings.json"),
      JSON.stringify(
        {
          backup: null,
          maxBuddy: 50,
          pendingBuddy: null,
          breedEgg: {
            ...BREED_EGG,
            rarity: "common",
            hat: "wizard"
          }
        },
        null,
        2
      ),
      "utf8"
    );

    assert.equal(loadSettings().breedEgg, null);
  });
});

test("loadSettings drops breedEgg payloads with an invalid hatchedUuid", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    writeFileSync(
      join(dataDir, "settings.json"),
      JSON.stringify(
        {
          backup: null,
          maxBuddy: 50,
          pendingBuddy: null,
          breedEgg: {
            ...BREED_EGG,
            hatchedUuid: "not-a-uuid"
          }
        },
        null,
        2
      ),
      "utf8"
    );

    assert.equal(loadSettings().breedEgg, null);
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

test("collection accepts bredFrom lineage data", async () => {
  await withTempEnvironment(async () => {
    const entry = saveToCollection({
      ...PENDING_BUDDY,
      uuid: "44444444-4444-4444-8444-444444444444",
      bredFrom: ["55555555-5555-4555-8555-555555555555", "66666666-6666-4666-8666-666666666666"]
    });

    assert.deepEqual(entry.bredFrom, ["55555555-5555-4555-8555-555555555555", "66666666-6666-4666-8666-666666666666"]);
    assert.deepEqual(loadCollection()[0].bredFrom, entry.bredFrom);
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
