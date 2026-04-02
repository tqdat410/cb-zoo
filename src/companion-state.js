import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { getClaudeDir } from "./config.js";
import { getCompanionFromConfig, resolveClaudeState } from "./claude-state.js";
import { renderSprite } from "./sprites.js";

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

export function getCurrentCompanion() {
  const { config } = resolveClaudeState({ allowLegacyUserId: true });
  const companion = getCompanionFromConfig(config);
  if (!companion) {
    return null;
  }
  const intro = findLatestCompanionIntro();
  return {
    ...companion,
    species: intro?.name === companion.name ? intro.species : null
  };
}

export function formatCompanionSummary(companion) {
  const species = companion.species || "unknown";
  const sprite = renderSprite(species === "unknown" ? "cat" : species, "°", "none").split("\n");
  const lines = [
    " Claude Companion",
    "",
    ` ${companion.name} the ${species}`,
    "",
    ...sprite.map((line) => `   ${line}`),
    "",
    companion.hatchedAt ? ` Hatched: ${new Date(companion.hatchedAt).toISOString()}` : null,
    " Stats: unavailable in live Claude state",
    "",
    " Personality:"
  ].filter(Boolean);
  const personalityLines = wrapText(companion.personality || "No personality text available.", 40).map((line) => ` ${line}`);
  const width = 44;
  const border = "═".repeat(width);
  return [
    `╔${border}╗`,
    ...[...lines, ...personalityLines].map((line) => `║ ${padLine(line, width)} ║`),
    `╚${border}╝`
  ].join("\n");
}
