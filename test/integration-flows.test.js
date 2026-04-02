import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { backupUuid, applyUuid, getCurrentUuid, restoreUuid } from "../src/uuid-manager.js";
import { loadCollection, saveToCollection, getStats, formatCollection } from "../src/collection.js";

function withTempEnvironment(callback, options = {}) {
  const baseDir = mkdtempSync(join(tmpdir(), "cb-zoo-"));
  const claudeDir = join(baseDir, ".claude");
  const dataDir = join(baseDir, ".cb-zoo");
  const appDataDir = join(baseDir, "AppData", "Roaming");
  const configLayouts = {
    primary: join(baseDir, ".claude.json"),
    claudeDirPrimary: join(claudeDir, ".claude.json"),
    legacy: join(claudeDir, ".config.json"),
    appData: join(appDataDir, "Claude", "config.json")
  };
  const configFile = configLayouts[options.configLayout || "primary"];

  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(dirname(configFile), { recursive: true });
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
    CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR,
    CB_ZOO_CONFIG_FILE: process.env.CB_ZOO_CONFIG_FILE,
    CB_ZOO_DATA_DIR: process.env.CB_ZOO_DATA_DIR,
    APPDATA: process.env.APPDATA
  };

  process.env.CB_ZOO_HOME = baseDir;
  process.env.CB_ZOO_DATA_DIR = dataDir;
  delete process.env.CB_ZOO_CLAUDE_DIR;
  delete process.env.CB_ZOO_CONFIG_FILE;
  delete process.env.CLAUDE_CONFIG_DIR;

  if (options.setCbZooClaudeDir) {
    process.env.CB_ZOO_CLAUDE_DIR = claudeDir;
  }
  if (options.setClaudeConfigDir) {
    process.env.CLAUDE_CONFIG_DIR = claudeDir;
  }
  if (options.setConfigOverride) {
    process.env.CB_ZOO_CONFIG_FILE = configFile;
  }
  if (options.configLayout === "appData") {
    process.env.APPDATA = appDataDir;
  }

  try {
    callback({ baseDir, claudeDir, dataDir, configFile, appDataDir });
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

test("uuid manager prefers .claude.json over legacy .config.json", () => {
  withTempEnvironment(({ baseDir, claudeDir, configFile }) => {
    const legacyConfigFile = join(claudeDir, ".config.json");
    writeFileSync(
      legacyConfigFile,
      JSON.stringify({ oauthAccount: { accountUuid: "99999999-9999-4999-8999-999999999999" } }, null, 2),
      "utf8"
    );
    assert.equal(configFile, join(baseDir, ".claude.json"));
    assert.equal(getCurrentUuid(), "00000000-0000-4000-8000-000000000000");
  });
});

test("uuid manager ignores shadow .claude/.claude.json when the home .claude.json exists", () => {
  withTempEnvironment(({ baseDir, claudeDir, configFile }) => {
    const shadowConfigFile = join(claudeDir, ".claude.json");
    writeFileSync(
      shadowConfigFile,
      JSON.stringify({ oauthAccount: { accountUuid: "99999999-9999-4999-8999-999999999999" } }, null, 2),
      "utf8"
    );
    assert.equal(configFile, join(baseDir, ".claude.json"));
    assert.equal(getCurrentUuid(), "00000000-0000-4000-8000-000000000000");

    applyUuid("11111111-1111-4111-8111-111111111111");
    assert.equal(JSON.parse(readFileSync(configFile, "utf8")).oauthAccount.accountUuid, "11111111-1111-4111-8111-111111111111");
    assert.equal(JSON.parse(readFileSync(shadowConfigFile, "utf8")).oauthAccount.accountUuid, "99999999-9999-4999-8999-999999999999");
  });
});

test("uuid manager reads CLAUDE_CONFIG_DIR/.claude.json when configured", () => {
  withTempEnvironment(
    ({ configFile, claudeDir }) => {
      assert.equal(configFile, join(claudeDir, ".claude.json"));
      assert.equal(getCurrentUuid(), "00000000-0000-4000-8000-000000000000");
    },
    { configLayout: "claudeDirPrimary", setClaudeConfigDir: true }
  );
});

test("uuid manager honors CB_ZOO_CONFIG_FILE before resolver fallbacks", () => {
  withTempEnvironment(
    ({ configFile, baseDir }) => {
      writeFileSync(
        join(baseDir, ".claude.json"),
        JSON.stringify({ oauthAccount: { accountUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" } }, null, 2),
        "utf8"
      );
      assert.equal(configFile, join(baseDir, ".claude", ".config.json"));
      assert.equal(getCurrentUuid(), "00000000-0000-4000-8000-000000000000");
    },
    { configLayout: "legacy", setConfigOverride: true }
  );
});

test("uuid manager treats CB_ZOO_CLAUDE_DIR as an authoritative sandbox override", () => {
  withTempEnvironment(
    ({ baseDir, claudeDir, configFile }) => {
      writeFileSync(
        join(baseDir, ".claude.json"),
        JSON.stringify({ oauthAccount: { accountUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" } }, null, 2),
        "utf8"
      );
      assert.equal(configFile, join(claudeDir, ".config.json"));
      assert.equal(getCurrentUuid(), "00000000-0000-4000-8000-000000000000");
    },
    { configLayout: "legacy", setCbZooClaudeDir: true }
  );
});

test("uuid manager falls back to legacy .config.json when .claude.json is missing", () => {
  withTempEnvironment(
    ({ configFile, claudeDir }) => {
      assert.equal(configFile, join(claudeDir, ".config.json"));
      assert.equal(getCurrentUuid(), "00000000-0000-4000-8000-000000000000");
    },
    { configLayout: "legacy" }
  );
});

test("uuid manager skips an invalid configured .claude.json and falls back to configured legacy .config.json", () => {
  withTempEnvironment(
    ({ claudeDir }) => {
      writeFileSync(join(claudeDir, ".claude.json"), "{not-json", "utf8");
      assert.equal(getCurrentUuid(), "00000000-0000-4000-8000-000000000000");
    },
    { configLayout: "legacy", setClaudeConfigDir: true }
  );
});

test("uuid manager falls back to APPDATA Claude config on Windows when primary files are missing", () => {
  if (process.platform !== "win32") {
    return;
  }
  withTempEnvironment(
    ({ appDataDir, configFile }) => {
      assert.equal(configFile, join(appDataDir, "Claude", "config.json"));
      assert.equal(getCurrentUuid(), "00000000-0000-4000-8000-000000000000");
    },
    { configLayout: "appData" }
  );
});

test("uuid manager skips an invalid home .claude.json and falls back to APPDATA Claude config on Windows", () => {
  if (process.platform !== "win32") {
    return;
  }
  withTempEnvironment(
    ({ baseDir }) => {
      writeFileSync(join(baseDir, ".claude.json"), "{not-json", "utf8");
      assert.equal(getCurrentUuid(), "00000000-0000-4000-8000-000000000000");
    },
    { configLayout: "appData" }
  );
});

test("getCurrentUuid can read legacy userID in read-only compatibility mode", () => {
  withTempEnvironment(({ configFile }) => {
    writeFileSync(configFile, JSON.stringify({ userID: "22222222-2222-4222-8222-222222222222" }, null, 2), "utf8");
    assert.equal(getCurrentUuid({ allowLegacyUserId: true }), "22222222-2222-4222-8222-222222222222");
    assert.throws(() => getCurrentUuid(), /valid oauthAccount\.accountUuid/i);
  });
});

test("cli current prints the real Claude companion summary when companion state exists", () => {
  withTempEnvironment(({ configFile, claudeDir }) => {
    writeFileSync(
      configFile,
      JSON.stringify(
        {
          oauthAccount: { accountUuid: "00000000-0000-4000-8000-000000000000" },
          companion: {
            name: "Plinth",
            personality: "A methodical tabby that paces when you introduce a bug.",
            hatchedAt: 1775023802769
          }
        },
        null,
        2
      ),
      "utf8"
    );
    const sessionDir = join(claudeDir, "projects", "demo-project");
    mkdirSync(sessionDir, { recursive: true });
    writeFileSync(
      join(sessionDir, "session.jsonl"),
      `${JSON.stringify({
        type: "attachment",
        attachment: { type: "companion_intro", name: "Plinth", species: "cat" },
        timestamp: "2026-04-02T03:33:04.530Z"
      })}\n`,
      "utf8"
    );

    const result = spawnSync(process.execPath, ["./src/cli.js", "--current"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env }
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Claude Companion/);
    assert.match(result.stdout, /Plinth the cat/);
    assert.match(result.stdout, /Stats: unavailable in live Claude state/);
    assert.match(result.stdout, /methodical tabby/i);
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

test("quick roll is blocked before local mutations when Claude uses live companion state", () => {
  withTempEnvironment(({ configFile, claudeDir, dataDir }) => {
    writeFileSync(
      configFile,
      JSON.stringify(
        {
          oauthAccount: { accountUuid: "00000000-0000-4000-8000-000000000000" },
          companion: {
            name: "Plinth",
            personality: "A methodical tabby that paces when you introduce a bug.",
            hatchedAt: 1775023802769
          }
        },
        null,
        2
      ),
      "utf8"
    );
    const sessionDir = join(claudeDir, "projects", "demo-project");
    mkdirSync(sessionDir, { recursive: true });
    writeFileSync(
      join(sessionDir, "session.jsonl"),
      `${JSON.stringify({
        type: "attachment",
        attachment: { type: "companion_intro", name: "Plinth", species: "cat" },
        timestamp: "2026-04-02T03:33:04.530Z"
      })}\n`,
      "utf8"
    );

    const result = spawnSync(process.execPath, ["./src/cli.js", "--quick"], {
      cwd: process.cwd(),
      encoding: "utf8",
      input: "q\n",
      env: { ...process.env }
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /live companion state/i);
    assert.equal(existsSync(join(dataDir, "backup.json")), false);
    assert.equal(existsSync(join(dataDir, "collection.json")), false);
    assert.equal(result.stdout.includes("Backed up current UUID"), false);
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
    assert.match(result.stderr, /must stay outside Claude config directories/i);
    assert.equal(existsSync(join(claudeDir, "backup.json")), false);
  });
});

test("backup rejects data directories inside Windows Claude appdata directory", () => {
  if (process.platform !== "win32") {
    return;
  }
  withTempEnvironment(
    ({ appDataDir }) => {
      const result = spawnSync(process.execPath, ["./src/cli.js", "--backup"], {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, CB_ZOO_DATA_DIR: join(appDataDir, "Claude", "cb-zoo-data") }
      });

      assert.equal(result.status, 1);
      assert.match(result.stderr, /must stay outside Claude config directories/i);
      assert.equal(existsSync(join(appDataDir, "Claude", "cb-zoo-data", "backup.json")), false);
    },
    { configLayout: "appData" }
  );
});

test("restore stays pinned to the backed-up Claude state file", () => {
  withTempEnvironment(({ configFile, claudeDir, dataDir }) => {
    backupUuid();
    writeFileSync(
      join(claudeDir, ".config.json"),
      JSON.stringify({ oauthAccount: { accountUuid: "99999999-9999-4999-8999-999999999999" } }, null, 2),
      "utf8"
    );
    rmSync(configFile);

    const result = spawnSync(process.execPath, ["./src/cli.js", "--restore"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env }
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /account state not found/i);
    assert.equal(JSON.parse(readFileSync(join(claudeDir, ".config.json"), "utf8")).oauthAccount.accountUuid, "99999999-9999-4999-8999-999999999999");
    assert.equal(JSON.parse(readFileSync(join(dataDir, "backup.json"), "utf8")).stateFile, configFile);
  });
});

test("restore rejects a tampered backup stateFile outside allowed Claude paths", () => {
  withTempEnvironment(({ baseDir, dataDir }) => {
    const unrelatedFile = join(baseDir, "unrelated.json");
    writeFileSync(
      unrelatedFile,
      JSON.stringify({ oauthAccount: { accountUuid: "77777777-7777-4777-8777-777777777777" }, metadata: { untouched: true } }, null, 2),
      "utf8"
    );
    writeFileSync(
      join(dataDir, "backup.json"),
      JSON.stringify({ uuid: "44444444-4444-4444-8444-444444444444", stateFile: unrelatedFile }, null, 2),
      "utf8"
    );

    const result = spawnSync(process.execPath, ["./src/cli.js", "--restore"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env }
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /unexpected Claude account state path/i);
    assert.equal(JSON.parse(readFileSync(unrelatedFile, "utf8")).oauthAccount.accountUuid, "77777777-7777-4777-8777-777777777777");
    assert.deepEqual(JSON.parse(readFileSync(unrelatedFile, "utf8")).metadata, { untouched: true });
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
