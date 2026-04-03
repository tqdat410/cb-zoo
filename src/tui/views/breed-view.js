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

function renderDetailBox(entry) {
  const accent = getRarityAccent(entry.rarity).color;
  const tint = (line) => (line && accent ? withPersistentAnsiColor(line, accent) : line);
  const titleText = `${getRarityAccent(entry.rarity).stars} ${entry.rarity.toUpperCase()} ${entry.species.toUpperCase()}`.trim();
  const titleLine = accent ? withPersistentAnsiColor(`${ANSI.bold}${titleText}${ANSI.reset}`, accent) : `${ANSI.bold}${titleText}${ANSI.reset}`;
  const contentLines = [
    titleLine,
    "",
    ...renderSprite(entry.species, entry.eye, entry.hat).split("\n").map((line) => tint(line)),
    "",
    tint(`Eyes: ${entry.eye}  Hat: ${entry.hat}`),
    tint(`Shiny: ${entry.shiny ? "yes" : "no"}  Total: ${entry.total}`)
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

function renderCompactParentBox(entry) {
  const accent = getRarityAccent(entry.rarity).color;
  const tint = (line) => (line && accent ? withPersistentAnsiColor(line, accent) : line);
  const titleText = `${getRarityAccent(entry.rarity).stars} ${entry.rarity.toUpperCase()} ${entry.species.toUpperCase()}`.trim();
  const titleLine = accent ? withPersistentAnsiColor(`${ANSI.bold}${titleText}${ANSI.reset}`, accent) : `${ANSI.bold}${titleText}${ANSI.reset}`;
  const contentLines = [
    titleLine,
    ...renderSprite(entry.species, entry.eye, entry.hat).split("\n").map((line) => tint(line)),
    tint(`Eyes: ${entry.eye}  Hat: ${entry.hat}`),
    tint(`Total: ${entry.total}  ${entry.shiny ? "Shiny" : "Plain"}`)
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

function renderParentSummary(entry, label) {
  const accent = getRarityAccent(entry.rarity).color;
  const summary = `${label}: ${entry.species.toUpperCase()} ${entry.rarity}`;
  return accent ? withPersistentAnsiColor(summary, accent) : summary;
}

function buildSelectBSubtitle(parentA) {
  return `← Back   ${renderParentSummary(parentA, "A")}`;
}

function buildConfirmSubtitle(parentA, parentB) {
  return `← Back   ${renderParentSummary(parentA, "A")}   ${renderParentSummary(parentB, "B")}`;
}

function combineParentBoxes(leftBox, rightBox) {
  const leftWidth = Math.max(...leftBox.map((line) => stripAnsi(line).length));
  const rightWidth = Math.max(...rightBox.map((line) => stripAnsi(line).length));
  const rowCount = Math.max(leftBox.length, rightBox.length);
  const middleRow = Math.floor(rowCount / 2);
  const lines = [];
  for (let index = 0; index < rowCount; index += 1) {
    const leftLine = leftBox[index] || " ".repeat(leftWidth);
    const rightLine = rightBox[index] || " ".repeat(rightWidth);
    const divider = index === middleRow ? `${ANSI.bold}×${ANSI.reset}` : " ";
    lines.push(`${padVisible(leftLine, leftWidth)} ${divider} ${padVisible(rightLine, rightWidth)}`);
  }
  return lines;
}

function getWindowedList(options, selectedIndex, bodyHeight, detailLines) {
  const reservedLines = detailLines.length + 2;
  const windowSize = Math.max(1, Math.min(6, bodyHeight - reservedLines));
  const windowStart = Math.max(0, Math.min(selectedIndex - Math.floor(windowSize / 2), Math.max(0, options.length - windowSize)));
  return options.slice(windowStart, windowStart + windowSize).map(({ entry }, index) => {
    const actualIndex = windowStart + index;
    const isSelected = actualIndex === selectedIndex;
    const accent = getRarityAccent(entry.rarity).color;
    const label = `${entry.species.padEnd(10)} ${entry.rarity.padEnd(10)} ${String(entry.total).padStart(3)}${entry.shiny ? " ✦" : ""}`;
    if (isSelected) {
      return accent
        ? `${accent}${ANSI.bold}▶ ${label}${ANSI.reset}`
        : `${ANSI.bold}▶ ${label}${ANSI.reset}`;
    }
    return accent ? `  ${withAnsiColor(label, accent)}` : `  ${label}`;
  });
}

function renderSelectorView(state, terminal, subtitle, footer) {
  const { bodyHeight, innerWidth } = getScreenMetrics(terminal);
  const options = state.breed.options || [];
  const selected = options[state.breed.selectIndex]?.entry || null;
  const detailLines = selected ? renderDetailBox(selected) : ["No buddy available."];
  const listLines = getWindowedList(options, state.breed.selectIndex, bodyHeight, detailLines);

  return {
    title: "BREED",
    subtitle,
    bodyLines: centerUniformBlockLines([
      ...listLines,
      "",
      ...detailLines
    ], innerWidth),
    footer,
    status: state.statusMessage || subtitle
  };
}

export function renderBreedSelectA(state, terminal = {}) {
  return renderSelectorView(state, terminal, "Choose the first buddy.", "Up/Down move  Enter confirm  Esc back");
}

export function renderBreedSelectB(state, terminal = {}) {
  const subtitle = state.breed.parentA
    ? buildSelectBSubtitle(state.breed.parentA)
    : "Choose the second buddy.";
  return renderSelectorView(state, terminal, subtitle, "Up/Down move  Enter confirm  ←/Esc back");
}

export function renderBreedConfirm(state, terminal = {}) {
  const { innerWidth } = getScreenMetrics(terminal);
  const parentALines = state.breed.parentA ? renderCompactParentBox(state.breed.parentA) : ["Parent A missing."];
  const parentBLines = state.breed.parentB ? renderCompactParentBox(state.breed.parentB) : ["Parent B missing."];

  return {
    title: "BREED",
    subtitle: buildConfirmSubtitle(state.breed.parentA, state.breed.parentB),
    bodyLines: centerUniformBlockLines(combineParentBoxes(parentALines, parentBLines), innerWidth),
    footer: "Enter breed  ←/Esc back",
    status: state.statusMessage || "Confirm the pairing."
  };
}
