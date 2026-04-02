import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { getClaudeDir } from "./config.js";
import { rollFrom } from "./buddy-engine.js";
import { getCompanionFromConfig, getUuidFromConfig, resolveClaudeState } from "./claude-state.js";
import { renderSprite } from "./sprites.js";
import { STARS } from "./config.js";

function padLine(value, width) {
  return `${value}${" ".repeat(Math.max(0, width - value.length))}`;
}

function wrapText(value, width = 50) {
  const words = value.trim().split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }
  return lines;
}

function collectJsonlFiles(directoryPath, files = []) {
  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    const nextPath = join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      collectJsonlFiles(nextPath, files);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".jsonl")) {
      files.push({ filePath: nextPath, modifiedAt: statSync(nextPath).mtimeMs });
    }
  }
  return files;
}

function findLatestCompanionIntro() {
  const projectsDir = join(getClaudeDir(), "projects");
  let files = [];
  try {
    files = collectJsonlFiles(projectsDir).sort((left, right) => right.modifiedAt - left.modifiedAt);
  } catch {
    return null;
  }

  for (const { filePath } of files) {
    const lines = readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).reverse();
    for (const line of lines) {
      if (!line.includes("\"companion_intro\"")) {
        continue;
      }
      try {
        const entry = JSON.parse(line);
        if (entry.type === "attachment" && entry.attachment?.type === "companion_intro") {
          return {
            name: typeof entry.attachment.name === "string" ? entry.attachment.name : null,
            species: typeof entry.attachment.species === "string" ? entry.attachment.species : null,
            timestamp: typeof entry.timestamp === "string" ? entry.timestamp : null
          };
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

function renderStatBar(value) {
  const filled = Math.max(0, Math.min(10, Math.floor(value / 10)));
  return `${"█".repeat(filled)}${"░".repeat(10 - filled)}`;
}

function rarityLabel(rarity) {
  return `${STARS[rarity]} ${rarity.toUpperCase()}`;
}

export function getCurrentCompanion() {
  const { config } = resolveClaudeState({ allowLegacyUserId: true });
  const companion = getCompanionFromConfig(config);
  if (!companion) {
    return null;
  }
  const intro = findLatestCompanionIntro();
  return {
    ...companion,
    uuid: getUuidFromConfig(config, { allowLegacyUserId: true }),
    species: intro?.name === companion.name ? intro.species : null
  };
}

export function formatCompanionSummary(companion) {
  const buddy = rollFrom(companion.uuid);
  const sprite = renderSprite(buddy.species, buddy.eye, buddy.hat).split("\n");
  const rarityLine = `${rarityLabel(buddy.rarity)}`;
  const speciesLine = buddy.species.toUpperCase();
  const lines = [
    ` ${rarityLine}${" ".repeat(Math.max(1, 42 - rarityLine.length - speciesLine.length))}${speciesLine}`,
    "",
    ...sprite.map((line) => `   ${line}`),
    "",
    ` ${companion.name}`,
    "",
    ...wrapText(`"${companion.personality || "No personality text available."}"`, 38).map((line) => ` ${line}`),
    "",
    ...Object.entries(buddy.stats).map(
      ([name, value]) => ` ${name.padEnd(10)} ${renderStatBar(value)} ${String(value).padStart(3)}`
    ),
    "",
    ` Peak: ${buddy.peak}  Dump: ${buddy.dump}`,
    ` Total: ${buddy.total}`,
    "",
    companion.hatchedAt ? ` Hatched: ${new Date(companion.hatchedAt).toISOString()}` : null,
    ` Eyes: ${buddy.eye}  Hat: ${buddy.hat}`,
    " Bones regenerated from current UUID"
  ].filter(Boolean);
  const width = 44;
  const border = "═".repeat(width);
  return [
    `╔${border}╗`,
    ...lines.map((line) => `║ ${padLine(line, width)} ║`),
    `╚${border}╝`
  ].join("\n");
}
