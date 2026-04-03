import { renderSprite } from "../../sprites.js";
import { getScreenMetrics } from "../render-layout.js";
import {
  ANSI,
  centerUniformBlockLines,
  createBoxLines,
  getRarityAccent,
  padVisible,
  stripAnsi,
  withAnsiColor,
  withPersistentAnsiColor
} from "../render-helpers.js";

function renderFramedBox(contentLines, accent) {
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

function formatSlotLabel(index) {
  return `Slot ${index + 1}`;
}

function formatSlotStatus(slot) {
  if (!slot) {
    return "empty";
  }
  return Date.now() >= slot.hatchAt ? "ready" : "incubating";
}

function renderDetailBox(entry) {
  const accent = getRarityAccent(entry.rarity).color;
  const tint = (line) => (line && accent ? withPersistentAnsiColor(line, accent) : line);
  const titleText = `${getRarityAccent(entry.rarity).stars} ${entry.rarity.toUpperCase()} ${entry.species.toUpperCase()}`.trim();
  return renderFramedBox([
    accent ? withPersistentAnsiColor(`${ANSI.bold}${titleText}${ANSI.reset}`, accent) : `${ANSI.bold}${titleText}${ANSI.reset}`,
    "",
    ...renderSprite(entry.species, entry.eye, entry.hat).split("\n").map((line) => tint(line)),
    "",
    tint(`Eyes: ${entry.eye}  Hat: ${entry.hat}`),
    tint(`Shiny: ${entry.shiny ? "yes" : "no"}  Total: ${entry.total}`)
  ], accent);
}

function renderCompactParentBox(entry) {
  const accent = getRarityAccent(entry.rarity).color;
  const tint = (line) => (line && accent ? withPersistentAnsiColor(line, accent) : line);
  const titleText = `${getRarityAccent(entry.rarity).stars} ${entry.rarity.toUpperCase()} ${entry.species.toUpperCase()}`.trim();
  return renderFramedBox([
    accent ? withPersistentAnsiColor(`${ANSI.bold}${titleText}${ANSI.reset}`, accent) : `${ANSI.bold}${titleText}${ANSI.reset}`,
    ...renderSprite(entry.species, entry.eye, entry.hat).split("\n").map((line) => tint(line)),
    tint(`Eyes: ${entry.eye}  Hat: ${entry.hat}`),
    tint(`Total: ${entry.total}  ${entry.shiny ? "Shiny" : "Plain"}`)
  ], accent);
}

function renderParentSummary(entry, label) {
  const accent = getRarityAccent(entry.rarity).color;
  const summary = `${label}: ${entry.species.toUpperCase()} ${entry.rarity}`;
  return accent ? withPersistentAnsiColor(summary, accent) : summary;
}

function buildSlotPrefix(slotIndex) {
  return slotIndex >= 0 ? `${formatSlotLabel(slotIndex)}  ` : "";
}

function buildSelectBSubtitle(parentA, slotIndex) {
  return `${buildSlotPrefix(slotIndex)}← Back   ${renderParentSummary(parentA, "A")}`;
}

function buildConfirmSubtitle(parentA, parentB, slotIndex) {
  return `${buildSlotPrefix(slotIndex)}← Back   ${renderParentSummary(parentA, "A")}   ${renderParentSummary(parentB, "B")}`;
}

function combineParentBoxes(leftBox, rightBox) {
  const leftWidth = Math.max(...leftBox.map((line) => stripAnsi(line).length));
  const rightWidth = Math.max(...rightBox.map((line) => stripAnsi(line).length));
  const rowCount = Math.max(leftBox.length, rightBox.length);
  const middleRow = Math.floor(rowCount / 2);
  return Array.from({ length: rowCount }, (_, index) => {
    const leftLine = leftBox[index] || " ".repeat(leftWidth);
    const rightLine = rightBox[index] || " ".repeat(rightWidth);
    const divider = index === middleRow ? `${ANSI.bold}×${ANSI.reset}` : " ";
    return `${padVisible(leftLine, leftWidth)} ${divider} ${padVisible(rightLine, rightWidth)}`;
  });
}

function getWindowedList(options, selectedIndex, bodyHeight, detailLines, buildLabel) {
  const reservedLines = detailLines.length + 2;
  const windowSize = Math.max(1, Math.min(6, bodyHeight - reservedLines));
  const windowStart = Math.max(0, Math.min(selectedIndex - Math.floor(windowSize / 2), Math.max(0, options.length - windowSize)));
  return options.slice(windowStart, windowStart + windowSize).map((option, index) => {
    const actualIndex = windowStart + index;
    const isSelected = actualIndex === selectedIndex;
    return buildLabel(option, isSelected);
  });
}

function renderSelectorView(state, terminal, subtitle, footer) {
  const { bodyHeight, innerWidth } = getScreenMetrics(terminal);
  const options = state.breed.options || [];
  const selected = options[state.breed.selectIndex]?.entry || null;
  const detailLines = selected ? renderDetailBox(selected) : ["No buddy available."];
  const listLines = getWindowedList(options, state.breed.selectIndex, bodyHeight, detailLines, ({ entry }, isSelected) => {
    const accent = getRarityAccent(entry.rarity).color;
    const label = `${entry.species.padEnd(10)} ${entry.rarity.padEnd(10)} ${String(entry.total).padStart(3)}${entry.shiny ? " ✦" : ""}`;
    if (isSelected) {
      return accent
        ? `${accent}${ANSI.bold}▶ ${label}${ANSI.reset}`
        : `${ANSI.bold}▶ ${label}${ANSI.reset}`;
    }
    return accent ? `  ${withAnsiColor(label, accent)}` : `  ${label}`;
  });

  return {
    title: "BREED",
    subtitle,
    bodyLines: centerUniformBlockLines([...listLines, "", ...detailLines], innerWidth),
    footer,
    status: state.statusMessage || subtitle
  };
}

function renderSlotDetailBox(slot, slotIndex) {
  if (!slot) {
    return createBoxLines([
      `${ANSI.bold}${formatSlotLabel(slotIndex)}${ANSI.reset}`,
      "",
      "Empty slot.",
      "Enter to start a new breed here."
    ], 28);
  }

  const accent = getRarityAccent(slot.rarity).color;
  const status = formatSlotStatus(slot);
  const header = `${slot.rarity.toUpperCase()} ${slot.species.toUpperCase()} EGG`;
  const details = [
    accent ? withPersistentAnsiColor(`${ANSI.bold}${header}${ANSI.reset}`, accent) : `${ANSI.bold}${header}${ANSI.reset}`,
    "",
    accent ? withPersistentAnsiColor(`Status: ${status}`, accent) : `Status: ${status}`,
    accent ? withPersistentAnsiColor(`Parents: ${slot.parentA.slice(0, 8)} x ${slot.parentB.slice(0, 8)}`, accent) : `Parents: ${slot.parentA.slice(0, 8)} x ${slot.parentB.slice(0, 8)}`,
    accent
      ? withPersistentAnsiColor(status === "ready" ? "Ready to hatch now." : `Hatches at ${new Date(slot.hatchAt).toLocaleTimeString("en-US", { hour12: false })}`, accent)
      : status === "ready"
        ? "Ready to hatch now."
        : `Hatches at ${new Date(slot.hatchAt).toLocaleTimeString("en-US", { hour12: false })}`
  ];
  return renderFramedBox(details, accent);
}

export function renderBreedSlotSelect(state, terminal = {}) {
  const { bodyHeight, innerWidth } = getScreenMetrics(terminal);
  const slots = state.breed.slots || [];
  const slotDescriptors = slots.map((slot, index) => ({ slot, index }));
  const selectedIndex = state.breed.selectIndex;
  const selectedSlot = slots[selectedIndex] ?? null;
  const detailLines = renderSlotDetailBox(selectedSlot, selectedIndex);
  const listLines = getWindowedList(slotDescriptors, selectedIndex, bodyHeight, detailLines, ({ slot, index }, isSelected) => {
    const status = formatSlotStatus(slot);
    const accent = slot ? getRarityAccent(slot.rarity).color : ANSI.dim;
    const label = slot
      ? `${formatSlotLabel(index).padEnd(8)} ${status.padEnd(10)} ${slot.rarity.padEnd(10)} ${slot.species}`
      : `${formatSlotLabel(index).padEnd(8)} empty`;
    if (isSelected) {
      return accent
        ? `${accent}${ANSI.bold}▶ ${label}${ANSI.reset}`
        : `${ANSI.bold}▶ ${label}${ANSI.reset}`;
    }
    return slot ? `${accent}  ${label}${ANSI.reset}` : `  ${label}`;
  });

  return {
    title: "BREED",
    subtitle: "Choose a breed slot.",
    bodyLines: centerUniformBlockLines([...listLines, "", ...detailLines], innerWidth),
    footer: "Up/Down move  Enter open  Esc back",
    status: state.statusMessage || "Choose a breed slot."
  };
}

export function renderBreedSelectA(state, terminal = {}) {
  return renderSelectorView(
    state,
    terminal,
    `${buildSlotPrefix(state.breed.slotIndex)}Choose the first buddy.`,
    "Up/Down move  Enter confirm  Esc back"
  );
}

export function renderBreedSelectB(state, terminal = {}) {
  const subtitle = state.breed.parentA
    ? buildSelectBSubtitle(state.breed.parentA, state.breed.slotIndex)
    : `${buildSlotPrefix(state.breed.slotIndex)}Choose the second buddy.`;
  return renderSelectorView(state, terminal, subtitle, "Up/Down move  Enter confirm  ←/Esc back");
}

export function renderBreedConfirm(state, terminal = {}) {
  const { innerWidth } = getScreenMetrics(terminal);
  const parentALines = state.breed.parentA ? renderCompactParentBox(state.breed.parentA) : ["Parent A missing."];
  const parentBLines = state.breed.parentB ? renderCompactParentBox(state.breed.parentB) : ["Parent B missing."];

  return {
    title: "BREED",
    subtitle: buildConfirmSubtitle(state.breed.parentA, state.breed.parentB, state.breed.slotIndex),
    bodyLines: centerUniformBlockLines(combineParentBoxes(parentALines, parentBLines), innerWidth),
    footer: "Enter breed  ←/Esc back",
    status: state.statusMessage || "Confirm the pairing."
  };
}
