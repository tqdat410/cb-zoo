import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

export async function withTempEnvironment(callback, options = {}) {
  const baseDir = mkdtempSync(join(tmpdir(), "cb-zoo-tui-"));
  const claudeDir = join(baseDir, ".claude");
  const dataDir = join(baseDir, ".cb-zoo");
  const configFile = join(baseDir, ".claude.json");
  const previous = {
    CB_ZOO_HOME: process.env.CB_ZOO_HOME,
    CB_ZOO_CLAUDE_DIR: process.env.CB_ZOO_CLAUDE_DIR,
    CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR,
    CB_ZOO_CONFIG_FILE: process.env.CB_ZOO_CONFIG_FILE,
    CB_ZOO_DATA_DIR: process.env.CB_ZOO_DATA_DIR
  };

  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(dirname(configFile), { recursive: true });
  writeFileSync(
    configFile,
    JSON.stringify(
      {
        oauthAccount: { accountUuid: "73e7fce7-9a2a-40b1-b78e-11571f33011a" },
        companion: options.withCompanion === false
          ? undefined
          : {
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
    await callback({ baseDir, claudeDir, dataDir, configFile, readConfig: () => JSON.parse(readFileSync(configFile, "utf8")) });
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
