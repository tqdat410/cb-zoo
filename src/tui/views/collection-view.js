import { renderSprite } from "../../sprites.js";
import { getScreenMetrics } from "../render-layout.js";
import {
  ANSI,
  centerUniformBlockLines,
  getRarityAccent,
  padVisible,
  stripAnsi,
  withAnsiColor,
  withPersistentAnsiColor
} from "../render-helpers.js";

function formatRolledDate(rolledAt) {
  return typeof rolledAt === "string" ? rolledAt.slice(0, 10) : "unknown";
}

function renderDetailBox(entry, options = {}) {
  const compact = options.compact ?? false;
  const accent = getRarityAccent(entry.rarity).color;
  const tint = (line) => (line && accent ? withPersistentAnsiColor(line, accent) : line);
  const titleText = `${getRarityAccent(entry.rarity).stars} ${entry.rarity.toUpperCase()} ${entry.species.toUpperCase()}`.trim();
  const titleLine = accent ? withPersistentAnsiColor(`${ANSI.bold}${titleText}${ANSI.reset}`, accent) : `${ANSI.bold}${titleText}${ANSI.reset}`;
  const spriteLines = renderSprite(entry.species, entry.eye, entry.hat).split("\n").map((line) => tint(line));
  const contentLines = compact
    ? [
        titleLine,
        ...spriteLines,
        tint(`Eyes: ${entry.eye}  Hat: ${entry.hat}`),
        tint(`Total: ${entry.total}  Shiny: ${entry.shiny ? "yes" : "no"}`)
      ]
    : [
        titleLine,
        "",
        ...spriteLines,
        "",
        tint(`Eyes: ${entry.eye}  Hat: ${entry.hat}`),
        tint(`Shiny: ${entry.shiny ? "yes" : "no"}  Total: ${entry.total}`),
        tint(`Rolled: ${formatRolledDate(entry.rolledAt)}`)
      ];
  const contentWidth = Math.max(24, ...contentLines.map((line) => stripAnsi(line).length));
  const topBorder = accent ? withAnsiColor(`┌${"─".repeat(contentWidth + 2)}┐`, accent) : `┌${"─".repeat(contentWidth + 2)}┐`;
  const bottomBorder = accent ? withAnsiColor(`└${"─".repeat(contentWidth + 2)}┘`, accent) : `└${"─".repeat(contentWidth + 2)}┘`;
  const sideBorder = accent ? withAnsiColor("│", accent) : "│";
  return [
    topBorder,
    ...contentLines.map((line) => `${sideBorder} ${padVisible(line, contentWidth)} ${sideBorder}`),
    bottomBorder
  ];
}

function renderDeletePrompt(entry) {
  const prompt = `Delete ${entry.species} from collection?`;
  const width = Math.max(prompt.length, 28);
  return [
    `┌${"─".repeat(width + 2)}┐`,
    `│ ${padVisible(prompt, width)} │`,
    `│ ${padVisible("Enter/Y delete  Esc/N cancel", width)} │`,
    `└${"─".repeat(width + 2)}┘`
  ];
}

export function renderCollectionView(state, terminal = {}) {
  const entries = state.collectionEntries;
  if (entries.length === 0) {
    return {
      title: "COLLECTION",
      subtitle: "Saved buddy collection",
      bodyLines: ["No buddies saved yet."],
      footer: "Esc back",
      status: state.statusMessage || "Collection empty."
    };
  }

  const { bodyHeight, innerWidth } = getScreenMetrics(terminal);
  const selected = entries[state.collectionIndex];
  const confirmDelete = state.collectionPrompt?.mode === "confirm-delete";
  const compactDetails = !confirmDelete && bodyHeight <= 15;
  const detailLines = confirmDelete ? renderDeletePrompt(selected) : renderDetailBox(selected, { compact: compactDetails });
  const separatorLines = compactDetails ? [] : [""];
  const windowSize = Math.max(1, Math.min(6, bodyHeight - detailLines.length - separatorLines.length - 1));
  const windowStart = Math.max(0, Math.min(state.collectionIndex - Math.floor(windowSize / 2), Math.max(0, entries.length - windowSize)));
  const listLines = entries.slice(windowStart, windowStart + windowSize).map((entry, index) => {
    const actualIndex = windowStart + index;
    const selectedIndex = actualIndex === state.collectionIndex;
    const accent = getRarityAccent(entry.rarity).color;
    const label = `${entry.species.padEnd(10)} ${entry.rarity.padEnd(10)} ${String(entry.total).padStart(3)}`;
    if (selectedIndex) {
      return accent
        ? `${accent}${ANSI.bold}▶ ${label}${ANSI.reset}`
        : `${ANSI.bold}▶ ${label}${ANSI.reset}`;
    }
    return accent ? `  ${withAnsiColor(label, accent)}` : `  ${label}`;
  });

  return {
    title: "COLLECTION",
    subtitle: "Saved buddy collection",
    bodyLines: centerUniformBlockLines(["Collection", ...listLines, ...separatorLines, ...detailLines], innerWidth),
    footer: confirmDelete ? "Enter/Y delete  Esc/N cancel" : "Up/Down move  Enter/A apply  D delete  Esc back",
    palette: getRarityAccent(selected.rarity).color,
    status: state.statusMessage || `${entries.length} buddies in collection.`
  };
}
