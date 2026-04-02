import { ANSI } from "../render-helpers.js";

const MENU_ITEMS = [
  { id: "roll", label: "Roll Buddy" },
  { id: "current", label: "Current Buddy" },
  { id: "collection", label: "Collection" },
  { id: "edit", label: "Edit Buddy" },
  { id: "backup", label: "Backup UUID" },
  { id: "restore", label: "Restore UUID" },
  { id: "quit", label: "Quit" }
];

export function getHomeMenuItems() {
  return MENU_ITEMS;
}

export function renderHomeView(state) {
  const bodyLines = [
    "╔════════════════════════════════════════════╗",
    "║  Pokemon-style capsule buddy machine      ║",
    "║  Pick a mode and keep hands on keyboard.  ║",
    "╚════════════════════════════════════════════╝",
    ""
  ];
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
    subtitle: "Pokemon handheld launcher",
    bodyLines,
    footer: "Up/Down move  Enter select  Q quit",
    status: state.statusMessage || "Ready."
  };
}
