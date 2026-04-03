#!/usr/bin/env node

const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { join, resolve } = require("node:path");
const { tmpdir } = require("node:os");

const repoRoot = resolve(__dirname, "..");

function createFixture(options = {}) {
  const baseDir = mkdtempSync(join(tmpdir(), "cb-zoo-release-smoke-"));
  const dataDir = join(baseDir, ".cb-zoo");
  const configFile = join(baseDir, ".claude.json");

  mkdirSync(dataDir, { recursive: true });
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

  return {
    baseDir,
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      CB_ZOO_HOME: baseDir,
      CB_ZOO_DATA_DIR: dataDir,
      CB_ZOO_CONFIG_FILE: configFile,
      CB_ZOO_CLAUDE_DIR: undefined,
      CLAUDE_CONFIG_DIR: undefined
    },
    cleanup() {
      rmSync(baseDir, { recursive: true, force: true });
    }
  };
}

function runCli(args, options = {}) {
  return spawnSync(process.execPath, ["./src/cli.js", ...args], {
    cwd: repoRoot,
    input: options.input ?? "",
    encoding: "utf8",
    env: options.env ?? { ...process.env, FORCE_COLOR: "0" }
  });
}

function assertSuccess(name, result, checks = []) {
  if (result.status !== 0) {
    throw new Error(`${name} failed with exit ${result.status}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  }

  for (const check of checks) {
    if (!check.predicate(result)) {
      throw new Error(`${name} failed: ${check.message}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
    }
  }
}

assertSuccess("help", runCli(["--help"]), [
  {
    message: "help output should include the title",
    predicate: (result) => /cb-zoo - Claude Buddy Gacha/.test(result.stdout)
  },
  {
    message: "help output should include the plain-mode flag",
    predicate: (result) => /--plain/.test(result.stdout)
  }
]);

const collectionFixture = createFixture({ withCompanion: false });
try {
  const result = runCli(["--collection"], { env: collectionFixture.env });
  assertSuccess("collection", result, [
    {
      message: "collection output should render the collection header",
      predicate: (outcome) => /CB-ZOO COLLECTION/.test(outcome.stdout)
    },
    {
      message: "collection output should start empty",
      predicate: (outcome) => /Total Rolls: 0/.test(outcome.stdout)
    }
  ]);
} finally {
  collectionFixture.cleanup();
}

const currentFixture = createFixture();
try {
  const result = runCli(["--current"], { env: currentFixture.env });
  assertSuccess("current", result, [
    {
      message: "current output should include the merged companion summary",
      predicate: (outcome) => /Bones regenerated from current UUID/.test(outcome.stdout)
    },
    {
      message: "current output should include the stored companion name",
      predicate: (outcome) => /Plinth/.test(outcome.stdout)
    }
  ]);
} finally {
  currentFixture.cleanup();
}

const plainQuickFixture = createFixture({ withCompanion: false });
try {
  const result = runCli(["--plain", "--quick"], {
    env: plainQuickFixture.env,
    input: "q\n"
  });
  assertSuccess("plain quick", result, [
    {
      message: "plain quick flow should create a backup before the prompt",
      predicate: (outcome) => /Backed up current UUID/.test(outcome.stdout)
    },
    {
      message: "plain quick flow should render the legacy apply-reroll-quit prompt",
      predicate: (outcome) => /\[A\]pply  \[R\]eroll  \[Q\]uit: /.test(outcome.stdout)
    }
  ]);
} finally {
  plainQuickFixture.cleanup();
}

process.stdout.write("CLI smoke checks passed.\n");
