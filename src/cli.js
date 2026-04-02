#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { rollFrom } from "./buddy-engine.js";
import { formatCompanionSummary, getCurrentCompanion } from "./companion-state.js";
import { animateGacha, quickReveal, showBuddyCard } from "./gacha-animation.js";
import { displayCollection, loadCollection, saveToCollection } from "./collection.js";
import { applyUuid, backupUuid, getCurrentUuid, hasBackup, restoreUuid } from "./uuid-manager.js";

let scriptedAnswersPromise;

async function getScriptedAnswers() {
  if (process.stdin.isTTY) {
    return null;
  }
  if (!scriptedAnswersPromise) {
    scriptedAnswersPromise = (async () => {
      const chunks = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      const lines = chunks.join("").split(/\r?\n/);
      if (lines.at(-1) === "") {
        lines.pop();
      }
      return lines;
    })();
  }
  return scriptedAnswersPromise;
}

async function prompt(question) {
  const scriptedAnswers = await getScriptedAnswers();
  if (scriptedAnswers) {
    if (scriptedAnswers.length === 0) {
      throw new Error("Roll mode requires stdin input. Run in a terminal or pipe A, R, or Q.");
    }
    process.stdout.write(question);
    return scriptedAnswers.shift().trim();
  }
  const { createInterface } = await import("node:readline");
  const reader = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    reader.question(question, (answer) => {
      reader.close();
      resolve(answer.trim());
    });
  });
}

function showHelp() {
  process.stdout.write(
    [
      "cb-zoo - Claude Buddy Gacha",
      "",
      "Usage: cb-zoo [options]",
      "",
      "Options:",
      "  (none)            Gacha roll with animation",
      "  -q, --quick       Roll without animation",
      "  -c, --collection  View your collection grid",
      "  --current         Show your current buddy",
      "  -b, --backup      Backup your current Claude UUID",
      "  -r, --restore     Restore your backed-up UUID",
      "  -h, --help        Show this help"
    ].join("\n") + "\n"
  );
}

async function showCurrentBuddy() {
  const companion = getCurrentCompanion();
  if (companion) {
    process.stdout.write(`${formatCompanionSummary(companion)}\n`);
    return;
  }
  const uuid = getCurrentUuid({ allowLegacyUserId: true });
  process.stdout.write(`${showBuddyCard(rollFrom(uuid))}\n`);
}

async function ensurePromptInputAvailable() {
  const scriptedAnswers = await getScriptedAnswers();
  if (scriptedAnswers === null) {
    return;
  }
  if (scriptedAnswers.length === 0) {
    throw new Error("Roll mode requires stdin input. Run in a terminal or pipe A, R, or Q.");
  }
}

async function gachaLoop(isQuick) {
  const companion = getCurrentCompanion();
  if (companion) {
    throw new Error(
      `Claude Code is using live companion state for ${companion.name}, so UUID rerolls no longer match the real buddy. cb-zoo roll/apply is disabled for this Claude version.`
    );
  }
  await ensurePromptInputAvailable();
  loadCollection();
  if (!hasBackup()) {
    const backup = backupUuid();
    process.stdout.write(`Backed up current UUID to ${backup.filePath}\n`);
  }

  while (true) {
    const buddy = rollFrom(randomUUID());
    if (isQuick) {
      quickReveal(buddy);
    } else {
      await animateGacha(buddy);
    }
    saveToCollection(buddy);
    while (true) {
      const answer = (await prompt("[A]pply  [R]eroll  [Q]uit: ")).toLowerCase();
      if (answer === "a" || answer === "apply") {
        const result = applyUuid(buddy.uuid);
        process.stdout.write(`Applied UUID ${result.uuid}\n${result.warning}\n`);
        return;
      }
      if (answer === "q" || answer === "quit") {
        return;
      }
      if (answer === "r" || answer === "reroll") {
        break;
      }
      process.stdout.write("Please choose A, R, or Q.\n");
    }
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      quick: { type: "boolean", short: "q", default: false },
      collection: { type: "boolean", short: "c", default: false },
      current: { type: "boolean", default: false },
      backup: { type: "boolean", short: "b", default: false },
      restore: { type: "boolean", short: "r", default: false },
      help: { type: "boolean", short: "h", default: false }
    },
    strict: true
  });

  if (values.help) {
    showHelp();
    return;
  }
  if (values.collection) {
    displayCollection();
    return;
  }
  if (values.current) {
    await showCurrentBuddy();
    return;
  }
  if (values.backup) {
    const result = backupUuid();
    process.stdout.write(
      result.created
        ? `Backed up current UUID to ${result.filePath}\n`
        : `Backup already exists at ${result.filePath}\n`
    );
    return;
  }
  if (values.restore) {
    const result = restoreUuid();
    process.stdout.write(`Restored UUID ${result.uuid}\n${result.warning}\n`);
    return;
  }
  await gachaLoop(values.quick);
}

main().catch((error) => {
  process.stderr.write(`cb-zoo failed: ${error.message}\n`);
  process.exitCode = 1;
});
