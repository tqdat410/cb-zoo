import { getScreenMetrics } from "../render-layout.js";
import { ANSI, centerBlockLines, createBoxLines } from "../render-helpers.js";
import { getPendingBuddy } from "../../settings-manager.js";

const BASE_MENU_ITEMS = [
  { id: "roll", label: "Roll Buddy" },
  { id: "current", label: "Current Buddy" },
  { id: "collection", label: "Collection" },
  { id: "edit", label: "Edit Current Buddy" },
  { id: "backup", label: "Back Up Claude UUID" },
  { id: "restore", label: "Restore Claude UUID" },
  { id: "quit", label: "Quit" }
];

export function getHomeMenuItems() {
  const hasPendingBuddy = getPendingBuddy() !== null;
  return BASE_MENU_ITEMS.map((item) => {
    if (item.id !== "roll") {
      return item;
    }
    return { ...item, label: hasPendingBuddy ? "Resume Roll" : item.label };
  });
}

export function renderHomeView(state, terminal = {}) {
  const { innerWidth } = getScreenMetrics(terminal);
  const hasPendingBuddy = getPendingBuddy() !== null;
  const menuItems = getHomeMenuItems();
  const heroLines = centerBlockLines(
    createBoxLines(
      ["Roll, collect, and apply Claude buddies.", "Keyboard-first, no filler."],
      Math.min(40, Math.max(24, innerWidth - 10))
    ),
    innerWidth
  );
  const bodyLines = [...heroLines, ""];
  for (const [index, item] of menuItems.entries()) {
    const selected = index === state.menuIndex;
    bodyLines.push(
      selected
        ? `${ANSI.gold}${ANSI.bold}▶ ${item.label}${ANSI.reset}`
        : `  ${item.label}`
    );
  }
  return {
    title: "HOME",
    subtitle: hasPendingBuddy ? "Claude buddy control deck  Pending roll ready" : "Claude buddy control deck",
    bodyLines,
    footer: "Up/Down move  Enter select  Q quit",
    status: state.statusMessage || "Ready to roll."
  };
}
