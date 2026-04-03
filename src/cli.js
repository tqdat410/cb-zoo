#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { rollFrom } from "./buddy-engine.js";
import { formatCompanionSummary, getCurrentCompanion } from "./companion-state.js";
import { animateGacha, quickReveal, showBuddyCard } from "./gacha-animation.js";
import { displayCollection, loadCollection, saveToCollection } from "./collection.js";
import { shouldLaunchTui } from "./launch-mode.js";
import { consumeRollCharge, formatRollCountdown, getRollChargeSnapshot } from "./roll-charge-manager.js";
import { setRollCharges } from "./settings-manager.js";
import { launchTuiApp } from "./tui/app.js";
import { applyUuid, backupUuid, getCurrentUuid, hasBackup, restoreUuid, updateCompanionMetadata } from "./uuid-manager.js";

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
      "  --plain           Force the legacy plain CLI flow",
      "  -q, --quick       Roll without animation",
      "  -c, --collection  View your collection grid",
      "  --current         Show your current buddy",
      "  --set-name        Update the current buddy name",
      "  --set-personality Update the current buddy personality",
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

function showUpdatedCompanion(companion, configFile) {
  const summary = formatCompanionSummary(companion);
  process.stdout.write(`Updated companion metadata in ${configFile}\n`);
  process.stdout.write(`${summary}\n`);
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
  await ensurePromptInputAvailable();
  loadCollection();

  while (true) {
    const chargeSnapshot = getRollChargeSnapshot();
    if (chargeSnapshot.available <= 0) {
      throw new Error(`No rolls left. Next +1 in ${formatRollCountdown(chargeSnapshot.msUntilNext)}.`);
    }
    if (!hasBackup()) {
      const backup = backupUuid();
      process.stdout.write(`Backed up current UUID to ${backup.filePath}\n`);
    }
    consumeRollCharge();
    let chargeCommitted = false;
    try {
      const buddy = rollFrom(randomUUID());
      if (isQuick) {
        quickReveal(buddy);
      } else {
        await animateGacha(buddy);
      }
      let collectionFull = false;
      try {
        saveToCollection(buddy);
        chargeCommitted = true;
      } catch (error) {
        if (!error.message.startsWith("Collection full")) {
          throw error;
        }
        collectionFull = true;
        chargeCommitted = true;
        process.stdout.write(`${error.message}\n`);
      }
      const rerollSnapshot = getRollChargeSnapshot();
      const canReroll = rerollSnapshot.available > 0;
      if (!canReroll) {
        process.stdout.write(`No rerolls left. Next +1 in ${formatRollCountdown(rerollSnapshot.msUntilNext)}.\n`);
      }
      while (true) {
        const question = collectionFull
          ? canReroll ? "[R]eroll  [Q]uit: " : "[Q]uit: "
          : canReroll ? "[A]pply  [R]eroll  [Q]uit: " : "[A]pply  [Q]uit: ";
        const answer = (await prompt(question)).toLowerCase();
        if (!collectionFull && (answer === "a" || answer === "apply")) {
          const result = applyUuid(buddy.uuid);
          process.stdout.write(`Applied UUID ${result.uuid}\n${result.warning}\n`);
          return;
        }
        if (answer === "q" || answer === "quit") {
          return;
        }
        if (canReroll && (answer === "r" || answer === "reroll")) {
          break;
        }
        process.stdout.write(
          collectionFull
            ? canReroll ? "Please choose R or Q.\n" : "Please choose Q.\n"
            : canReroll ? "Please choose A, R, or Q.\n" : "Please choose A or Q.\n"
        );
      }
    } catch (error) {
      if (!chargeCommitted) {
        setRollCharges({ available: chargeSnapshot.available, updatedAt: chargeSnapshot.updatedAt });
      }
      throw error;
    }
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      quick: { type: "boolean", short: "q", default: false },
      plain: { type: "boolean", default: false },
      collection: { type: "boolean", short: "c", default: false },
      current: { type: "boolean", default: false },
      "set-name": { type: "string" },
      "set-personality": { type: "string" },
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
  if (shouldLaunchTui(values)) {
    await launchTuiApp();
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
  if (values["set-name"] !== undefined || values["set-personality"] !== undefined) {
    const result = updateCompanionMetadata({
      name: values["set-name"],
      personality: values["set-personality"]
    });
    showUpdatedCompanion(result.companion, result.configFile);
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
