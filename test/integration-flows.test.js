import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { backupUuid, applyUuid, getCurrentUuid, restoreUuid } from "../src/uuid-manager.js";
import { loadCollection, saveToCollection, getStats, formatCollection } from "../src/collection.js";

function withTempEnvironment(callback) {
  const baseDir = mkdtempSync(join(tmpdir(), "cb-zoo-"));
  const claudeDir = join(baseDir, ".claude");
  const dataDir = join(baseDir, ".cb-zoo");
  const configFile = join(claudeDir, ".config.json");

  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(
    configFile,
    JSON.stringify(
      {
        oauthAccount: { accountUuid: "00000000-0000-4000-8000-000000000000" },
        accessToken: "redacted",
        metadata: { keeps: true }
      },
      null,
      2
    ),
    "utf8"
  );

  const previous = {
    CB_ZOO_HOME: process.env.CB_ZOO_HOME,
    CB_ZOO_CLAUDE_DIR: process.env.CB_ZOO_CLAUDE_DIR,
    CB_ZOO_CONFIG_FILE: process.env.CB_ZOO_CONFIG_FILE,
    CB_ZOO_DATA_DIR: process.env.CB_ZOO_DATA_DIR
  };

  process.env.CB_ZOO_HOME = baseDir;
  process.env.CB_ZOO_CLAUDE_DIR = claudeDir;
  process.env.CB_ZOO_CONFIG_FILE = configFile;
  process.env.CB_ZOO_DATA_DIR = dataDir;

  try {
    callback({ baseDir, claudeDir, dataDir, configFile });
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

test("uuid backup, apply, and restore preserve the rest of the Claude config", () => {
  withTempEnvironment(({ configFile }) => {
    assert.equal(getCurrentUuid(), "00000000-0000-4000-8000-000000000000");
    const backup = backupUuid();
    assert.equal(backup.created, true);

    applyUuid("11111111-1111-4111-8111-111111111111");
    let updated = JSON.parse(readFileSync(configFile, "utf8"));
    assert.equal(updated.oauthAccount.accountUuid, "11111111-1111-4111-8111-111111111111");
    assert.deepEqual(updated.metadata, { keeps: true });

    restoreUuid();
    updated = JSON.parse(readFileSync(configFile, "utf8"));
    assert.equal(updated.oauthAccount.accountUuid, "00000000-0000-4000-8000-000000000000");
  });
});

test("uuid manager rejects malformed UUIDs from Claude config and apply requests", () => {
  withTempEnvironment(({ configFile }) => {
    writeFileSync(
      configFile,
      JSON.stringify({ oauthAccount: { accountUuid: "not-a-uuid" } }, null, 2),
      "utf8"
    );

    assert.throws(() => getCurrentUuid(), /valid oauthAccount\.accountUuid/i);
    assert.throws(() => applyUuid("still-not-a-uuid"), /invalid UUID/i);
    assert.equal(JSON.parse(readFileSync(configFile, "utf8")).oauthAccount.accountUuid, "not-a-uuid");
  });
});

test("applyUuid rejects invalid config container shapes", () => {
  withTempEnvironment(({ configFile }) => {
    writeFileSync(configFile, JSON.stringify(null), "utf8");
    assert.throws(() => applyUuid("11111111-1111-4111-8111-111111111111"), /must contain a JSON object/i);

    writeFileSync(configFile, JSON.stringify({ oauthAccount: [] }, null, 2), "utf8");
    assert.throws(() => applyUuid("11111111-1111-4111-8111-111111111111"), /valid oauthAccount object/i);
    assert.equal(readFileSync(configFile, "utf8").includes("\"accountUuid\""), false);

    writeFileSync(configFile, JSON.stringify({ oauthAccount: { accountUuid: "not-a-uuid" } }, null, 2), "utf8");
    assert.throws(() => applyUuid("11111111-1111-4111-8111-111111111111"), /valid oauthAccount\.accountUuid/i);
    assert.equal(JSON.parse(readFileSync(configFile, "utf8")).oauthAccount.accountUuid, "not-a-uuid");
  });
});

test("uuid manager tolerates a UTF-8 BOM in Claude config", () => {
  withTempEnvironment(({ configFile }) => {
    writeFileSync(
      configFile,
      `\uFEFF${JSON.stringify({ oauthAccount: { accountUuid: "22222222-2222-4222-8222-222222222222" } }, null, 2)}`,
      "utf8"
    );

    assert.equal(getCurrentUuid(), "22222222-2222-4222-8222-222222222222");
  });
});

test("collection persistence and stats track unique combos and shinies", () => {
  withTempEnvironment(() => {
    saveToCollection({
      uuid: "11111111-1111-4111-8111-111111111111",
      species: "robot",
      rarity: "rare",
      eye: "✦",
      hat: "crown",
      shiny: false,
      total: 259
    });
    saveToCollection({
      uuid: "22222222-2222-4222-8222-222222222222",
      species: "robot",
      rarity: "rare",
      eye: "◉",
      hat: "wizard",
      shiny: true,
      total: 275
    });
    saveToCollection({
      uuid: "33333333-3333-4333-8333-333333333333",
      species: "duck",
      rarity: "common",
      eye: "·",
      hat: "none",
      shiny: false,
      total: 180
    });

    const collection = loadCollection();
    const stats = getStats(collection);
    assert.equal(collection.length, 3);
    assert.equal(stats.unique, 2);
    assert.equal(stats.shinies, 1);
    assert.equal(stats.rarest.species, "robot");
    assert.match(formatCollection(collection), /robot/);
  });
});

test("backup rejects an existing file without a valid UUID", () => {
  withTempEnvironment(({ dataDir }) => {
    writeFileSync(join(dataDir, "backup.json"), JSON.stringify({}, null, 2), "utf8");

    const result = spawnSync(process.execPath, ["./src/cli.js", "--backup"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env }
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /backup exists but is invalid/i);
  });
});

test("backup rejects an existing temporary file path", () => {
  withTempEnvironment(({ dataDir }) => {
    const tempFile = join(dataDir, "backup.json.tmp");
    writeFileSync(tempFile, "placeholder", "utf8");

    assert.throws(() => backupUuid(), /existing temporary file/i);
    assert.equal(existsSync(join(dataDir, "backup.json")), false);
    assert.equal(readFileSync(tempFile, "utf8"), "placeholder");
  });
});

test("restore rejects a malformed UUID in backup without touching Claude config", () => {
  withTempEnvironment(({ configFile, dataDir }) => {
    writeFileSync(join(dataDir, "backup.json"), JSON.stringify({ uuid: "not-a-uuid" }, null, 2), "utf8");

    const result = spawnSync(process.execPath, ["./src/cli.js", "--restore"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env }
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /valid UUID/i);
    assert.equal(JSON.parse(readFileSync(configFile, "utf8")).oauthAccount.accountUuid, "00000000-0000-4000-8000-000000000000");
  });
});

test("restore rejects a malformed current config UUID without touching Claude config", () => {
  withTempEnvironment(({ configFile, dataDir }) => {
    writeFileSync(configFile, JSON.stringify({ oauthAccount: { accountUuid: "not-a-uuid" } }, null, 2), "utf8");
    writeFileSync(
      join(dataDir, "backup.json"),
      JSON.stringify({ uuid: "44444444-4444-4444-8444-444444444444" }, null, 2),
      "utf8"
    );

    const result = spawnSync(process.execPath, ["./src/cli.js", "--restore"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env }
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /valid oauthAccount\.accountUuid/i);
    assert.equal(JSON.parse(readFileSync(configFile, "utf8")).oauthAccount.accountUuid, "not-a-uuid");
  });
});

test("corrupt collection blocks quick roll before overwriting local data", () => {
  withTempEnvironment(({ dataDir }) => {
    const collectionFile = join(dataDir, "collection.json");
    writeFileSync(collectionFile, "{not-json", "utf8");

    const result = spawnSync(process.execPath, ["./src/cli.js", "--quick"], {
      cwd: process.cwd(),
      encoding: "utf8",
      input: "q\n",
      env: { ...process.env }
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /collection exists but is invalid/i);
    assert.equal(readFileSync(collectionFile, "utf8"), "{not-json");
    assert.equal(existsSync(join(dataDir, "backup.json")), false);
    assert.equal(result.stdout.includes("Backed up current UUID"), false);
    assert.equal(result.stdout.includes("[A]pply"), false);
  });
});

test("invalid collection entries block quick roll before backup or reveal", () => {
  withTempEnvironment(({ dataDir }) => {
    const collectionFile = join(dataDir, "collection.json");
    writeFileSync(collectionFile, "[42]\n", "utf8");

    const result = spawnSync(process.execPath, ["./src/cli.js", "--quick"], {
      cwd: process.cwd(),
      encoding: "utf8",
      input: "q\n",
      env: { ...process.env }
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /collection exists but is invalid/i);
    assert.equal(readFileSync(collectionFile, "utf8"), "[42]\n");
    assert.equal(result.stdout.includes("Backed up current UUID"), false);
    assert.equal(result.stdout.includes("[A]pply"), false);
  });
});

test("collection save rejects an existing temporary file path", () => {
  withTempEnvironment(({ dataDir }) => {
    const tempFile = join(dataDir, "collection.json.tmp");
    writeFileSync(tempFile, "placeholder", "utf8");

    assert.throws(
      () =>
        saveToCollection({
          uuid: "55555555-5555-4555-8555-555555555555",
          species: "robot",
          rarity: "rare",
          eye: "✦",
          hat: "crown",
          shiny: false,
          total: 260
        }),
      /existing temporary file/i
    );
    assert.equal(existsSync(join(dataDir, "collection.json")), false);
    assert.equal(readFileSync(tempFile, "utf8"), "placeholder");
  });
});

test("backup rejects data directories inside Claude config directory", () => {
  withTempEnvironment(({ claudeDir }) => {
    const result = spawnSync(process.execPath, ["./src/cli.js", "--backup"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, CB_ZOO_DATA_DIR: claudeDir }
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /must stay outside the Claude config directory/i);
    assert.equal(existsSync(join(claudeDir, "backup.json")), false);
  });
});

test("cli help renders successfully", () => {
  const result = spawnSync(process.execPath, ["./src/cli.js", "--help"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /cb-zoo - Claude Buddy Gacha/);
});

test("unknown flags fail fast instead of starting a roll", () => {
  const result = spawnSync(process.execPath, ["./src/cli.js", "--bogus"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown option '--bogus'/);
});

test("invalid prompt input does not create extra rolls", () => {
  withTempEnvironment(({ dataDir }) => {
    const result = spawnSync(process.execPath, ["./src/cli.js", "--quick"], {
      cwd: process.cwd(),
      encoding: "utf8",
      input: "x\nq\n",
      env: { ...process.env }
    });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Please choose A, R, or Q\./);
    const entries = JSON.parse(readFileSync(join(dataDir, "collection.json"), "utf8"));
    assert.equal(entries.length, 1);
  });
});

test("FORCE_COLOR=0 disables ANSI support", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true }); import('./src/gacha-animation.js').then((m) => console.log(m.supportsAnsi()));"
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, FORCE_COLOR: "0" }
    }
  );
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "false");
});

test("corrupt backup blocks quick apply before touching Claude config", () => {
  withTempEnvironment(({ configFile, dataDir }) => {
    writeFileSync(join(dataDir, "backup.json"), "{not-json", "utf8");
    const result = spawnSync(process.execPath, ["./src/cli.js", "--quick"], {
      cwd: process.cwd(),
      encoding: "utf8",
      input: "a\n",
      env: { ...process.env }
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /backup exists but is invalid/i);
    assert.equal(JSON.parse(readFileSync(configFile, "utf8")).oauthAccount.accountUuid, "00000000-0000-4000-8000-000000000000");
    assert.equal(loadCollection().length, 0);
  });
});

test("closed stdin fails before the roll loop mutates local state", () => {
  withTempEnvironment(({ dataDir }) => {
    const result = spawnSync(process.execPath, ["./src/cli.js", "--quick"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env }
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /requires stdin input/i);
    assert.equal(loadCollection().length, 0);
    assert.equal(result.stdout.includes("Backed up current UUID"), false);
    assert.equal(result.stdout.includes("[A]pply"), false);
    assert.equal(result.stdout.includes(dataDir), false);
  });
});
