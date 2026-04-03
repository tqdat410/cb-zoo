import { getScreenMetrics } from "../render-layout.js";
import { ANSI, centerBlockLines, createBoxLines } from "../render-helpers.js";
import { formatRollChargeSummary, getRollChargeSnapshot } from "../../roll-charge-manager.js";
import { getBreedEgg, getPendingBuddy, isEggReady } from "../../settings-manager.js";

const BASE_MENU_ITEMS = [
  { id: "roll", label: "Roll Buddy" },
  { id: "current", label: "Current Buddy" },
  { id: "collection", label: "Collection" },
  { id: "breed", label: "Breed Buddy" },
  { id: "edit", label: "Edit Current Buddy" },
  { id: "backup", label: "Back Up Claude UUID" },
  { id: "restore", label: "Restore Claude UUID" },
  { id: "quit", label: "Quit" }
];

export function getHomeMenuItems() {
  const hasPendingBuddy = getPendingBuddy() !== null;
  const breedEgg = getBreedEgg();
  const eggReady = isEggReady();
  return BASE_MENU_ITEMS.map((item) => {
    if (item.id === "roll") {
      return { ...item, label: hasPendingBuddy ? "Resume Roll" : item.label };
    }
    if (item.id === "breed" && breedEgg) {
      return { ...item, label: eggReady ? "Hatch Egg" : "View Egg" };
    }
    if (item.id !== "roll") {
      return item;
    }
    return item;
  });
}

export function renderHomeView(state, terminal = {}) {
  const { innerWidth } = getScreenMetrics(terminal);
  const hasPendingBuddy = getPendingBuddy() !== null;
  const breedEgg = getBreedEgg();
  const eggReady = isEggReady();
  const chargeSnapshot = getRollChargeSnapshot();
  const menuItems = getHomeMenuItems();
  const heroLines = centerBlockLines(
    createBoxLines(
      ["Roll, collect, and apply Claude buddies.", "Keyboard-first, no filler."],
      Math.min(40, Math.max(24, innerWidth - 10))
    ),
    innerWidth
  );
  const bodyLines = [...heroLines, ""];
  if (eggReady) {
    bodyLines.push(...centerBlockLines(createBoxLines(["Egg ready to hatch."], Math.min(28, Math.max(20, innerWidth - 12))), innerWidth));
    bodyLines.push("");
  } else if (breedEgg) {
    bodyLines.push(...centerBlockLines(createBoxLines(["Egg incubating in settings."], Math.min(30, Math.max(20, innerWidth - 12))), innerWidth));
    bodyLines.push("");
  }
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
    subtitle: hasPendingBuddy
      ? "Claude buddy control deck  Pending roll ready"
      : eggReady
        ? "Claude buddy control deck  Egg ready"
        : breedEgg
          ? "Claude buddy control deck  Egg incubating"
          : "Claude buddy control deck",
    bodyLines,
    footer: "Up/Down move  Enter select  Q quit",
    topRight: `${ANSI.dim}${formatRollChargeSummary(chargeSnapshot)}${ANSI.reset}`,
    status: state.statusMessage || "Ready to roll."
  };
}
