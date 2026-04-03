import { getScreenMetrics } from "../render-layout.js";
import { ANSI, centerBlockLines, createBoxLines } from "../render-helpers.js";

const MENU_ITEMS = [
  { id: "roll", label: "Roll Buddy" },
  { id: "current", label: "Current Buddy" },
  { id: "collection", label: "Collection" },
  { id: "edit", label: "Edit Current Buddy" },
  { id: "backup", label: "Back Up Claude UUID" },
  { id: "restore", label: "Restore Claude UUID" },
  { id: "quit", label: "Quit" }
];

export function getHomeMenuItems() {
  return MENU_ITEMS;
}

export function renderHomeView(state, terminal = {}) {
  const { innerWidth } = getScreenMetrics(terminal);
  const heroLines = centerBlockLines(
    createBoxLines(
      ["Roll, collect, and apply Claude buddies.", "Keyboard-first, no filler."],
      Math.min(40, Math.max(24, innerWidth - 10))
    ),
    innerWidth
  );
  const bodyLines = [...heroLines, ""];
  for (const [index, item] of MENU_ITEMS.entries()) {
    const selected = index === state.menuIndex;
    bodyLines.push(
      selected
        ? `${ANSI.gold}${ANSI.bold}▶ ${item.label}${ANSI.reset}`
        : `  ${item.label}`
    );
  }
  return {
    title: "HOME",
    subtitle: "Claude buddy control deck",
    bodyLines,
    footer: "Up/Down move  Enter select  Q quit",
    status: state.statusMessage || "Ready to roll."
  };
}
