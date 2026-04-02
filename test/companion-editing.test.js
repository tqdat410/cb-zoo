import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { updateCompanionMetadata } from "../src/uuid-manager.js";

function withCompanionEnvironment(callback) {
  const baseDir = mkdtempSync(join(tmpdir(), "cb-zoo-companion-"));
  const dataDir = join(baseDir, ".cb-zoo");
  const configFile = join(baseDir, ".claude.json");
  const previous = {
    CB_ZOO_HOME: process.env.CB_ZOO_HOME,
    CB_ZOO_DATA_DIR: process.env.CB_ZOO_DATA_DIR,
    CB_ZOO_CLAUDE_DIR: process.env.CB_ZOO_CLAUDE_DIR,
    CB_ZOO_CONFIG_FILE: process.env.CB_ZOO_CONFIG_FILE,
    CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR
  };

  mkdirSync(dataDir, { recursive: true });
  mkdirSync(dirname(configFile), { recursive: true });
  writeFileSync(
    configFile,
    JSON.stringify(
      {
        oauthAccount: { accountUuid: "73e7fce7-9a2a-40b1-b78e-11571f33011a" },
        companion: {
          name: "Plinth",
          personality: "A methodical tabby that paces when you introduce a bug.",
          hatchedAt: 1775023802769
        },
        metadata: { keeps: true }
      },
      null,
      2
    ),
    "utf8"
  );

  process.env.CB_ZOO_HOME = baseDir;
  process.env.CB_ZOO_DATA_DIR = dataDir;
  delete process.env.CB_ZOO_CLAUDE_DIR;
  delete process.env.CB_ZOO_CONFIG_FILE;
  delete process.env.CLAUDE_CONFIG_DIR;

  try {
    callback({ configFile });
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    rmSync(baseDir, { recursive: true, force: true });
  }
}

test("updateCompanionMetadata updates only the provided companion fields", () => {
  withCompanionEnvironment(({ configFile }) => {
    const result = updateCompanionMetadata({ name: "  Milo  " });
    const updated = JSON.parse(readFileSync(configFile, "utf8"));

    assert.equal(result.companion.name, "Milo");
    assert.equal(updated.companion.name, "Milo");
    assert.equal(updated.companion.personality, "A methodical tabby that paces when you introduce a bug.");
    assert.equal(updated.companion.hatchedAt, 1775023802769);
    assert.equal(updated.oauthAccount.accountUuid, "73e7fce7-9a2a-40b1-b78e-11571f33011a");
    assert.deepEqual(updated.metadata, { keeps: true });
  });
});

test("updateCompanionMetadata can update name and personality together", () => {
  withCompanionEnvironment(({ configFile }) => {
    updateCompanionMetadata({ name: "Nova", personality: " Calm under pressure. " });
    const updated = JSON.parse(readFileSync(configFile, "utf8"));

    assert.equal(updated.companion.name, "Nova");
    assert.equal(updated.companion.personality, "Calm under pressure.");
  });
});

test("updateCompanionMetadata leaves optional companion fields untouched when not provided", () => {
  withCompanionEnvironment(({ configFile }) => {
    writeFileSync(
      configFile,
      JSON.stringify(
        {
          oauthAccount: { accountUuid: "73e7fce7-9a2a-40b1-b78e-11571f33011a" },
          companion: { name: "Plinth", hatchedAt: 1775023802769 }
        },
        null,
        2
      ),
      "utf8"
    );

    updateCompanionMetadata({ name: "Nova" });
    const updated = JSON.parse(readFileSync(configFile, "utf8"));

    assert.equal(updated.companion.name, "Nova");
    assert.equal("personality" in updated.companion, false);
    assert.equal(updated.companion.hatchedAt, 1775023802769);
  });
});

test("updateCompanionMetadata rejects missing or blank edit values", () => {
  withCompanionEnvironment(() => {
    assert.throws(() => updateCompanionMetadata({}), /set-name and\/or --set-personality/i);
    assert.throws(() => updateCompanionMetadata({ name: "   " }), /name cannot be empty/i);
    assert.throws(() => updateCompanionMetadata({ personality: "\n\t" }), /personality cannot be empty/i);
  });
});

test("updateCompanionMetadata rejects missing companion state", () => {
  withCompanionEnvironment(({ configFile }) => {
    writeFileSync(
      configFile,
      JSON.stringify({ oauthAccount: { accountUuid: "73e7fce7-9a2a-40b1-b78e-11571f33011a" } }, null, 2),
      "utf8"
    );
    assert.throws(() => updateCompanionMetadata({ name: "Nova" }), /does not contain an editable companion/i);
  });
});

test("cli edit flags print the updated companion summary", () => {
  withCompanionEnvironment(() => {
    const result = spawnSync(process.execPath, ["./src/cli.js", "--set-name", "Nova", "--set-personality", "Calm under pressure."], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env }
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Updated companion metadata in/);
    assert.match(result.stdout, /Nova/);
    assert.match(result.stdout, /Calm under pressure\./);
    assert.match(result.stdout, /Bones regenerated from current UUID/);
  });
});

test("cli edit flags tolerate malformed stored hatchedAt values without crashing", () => {
  withCompanionEnvironment(({ configFile }) => {
    writeFileSync(
      configFile,
      JSON.stringify(
        {
          oauthAccount: { accountUuid: "73e7fce7-9a2a-40b1-b78e-11571f33011a" },
          companion: {
            name: "Plinth",
            personality: "A methodical tabby that paces when you introduce a bug.",
            hatchedAt: "not-a-timestamp"
          }
        },
        null,
        2
      ),
      "utf8"
    );

    const result = spawnSync(process.execPath, ["./src/cli.js", "--set-name", "Nova"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env }
    });

    const updated = JSON.parse(readFileSync(configFile, "utf8"));
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Updated companion metadata in/);
    assert.equal(updated.companion.name, "Nova");
    assert.equal(updated.companion.hatchedAt, "not-a-timestamp");
  });
});
