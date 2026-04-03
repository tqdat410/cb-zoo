import { getScreenMetrics } from "../render-layout.js";
import { ANSI, centerBlockLines, centerVisible, createBoxLines } from "../render-helpers.js";
import { formatRollCountdown, getRollChargeSnapshot } from "../../roll-charge-manager.js";
import { getBreedSlots, getMaxBuddy, getPendingBuddy } from "../../settings-manager.js";
import { loadCollection } from "../../collection.js";

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
  return BASE_MENU_ITEMS.map((item) => {
    if (item.id === "roll") {
      return { ...item, label: hasPendingBuddy ? "Resume Roll" : item.label };
    }
    return item;
  });
}

function summarizeBreedSlots(breedSlots) {
  return breedSlots.reduce((summary, slot) => {
    if (!slot) {
      summary.empty += 1;
    } else if (Date.now() >= slot.hatchAt) {
      summary.ready += 1;
    } else {
      summary.incubating += 1;
    }
    return summary;
  }, { ready: 0, incubating: 0, empty: 0 });
}

export function renderHomeView(state, terminal = {}) {
  const { innerWidth } = getScreenMetrics(terminal);
  const hasPendingBuddy = getPendingBuddy() !== null;
  const breedSlots = getBreedSlots();
  const slotSummary = summarizeBreedSlots(breedSlots);
  const chargeSnapshot = getRollChargeSnapshot();
  const collectionCount = loadCollection().length;
  const maxBuddy = getMaxBuddy();
  const countdown = chargeSnapshot.isFull ? "--:--" : formatRollCountdown(chargeSnapshot.msUntilNext);
  const menuItems = getHomeMenuItems();
  const heroLines = centerBlockLines(
    createBoxLines(
      ["Roll, breed, and collect Claude buddies.", "Equip, hatch, and manage them here."],
      Math.min(40, Math.max(24, innerWidth - 10))
    ),
    innerWidth
  );
  const bodyLines = [...heroLines, ""];
  bodyLines.push(
    ...centerBlockLines(
      createBoxLines(
        [
          `Breed slots: ${slotSummary.ready} ready | ${slotSummary.incubating} incubating | ${slotSummary.empty} empty`,
          slotSummary.ready > 0
            ? "Open Breed Buddy to choose a ready slot."
            : slotSummary.incubating > 0
              ? "Open Breed Buddy to resume an incubator."
              : "Open Breed Buddy to start in any empty slot."
        ],
        Math.min(48, Math.max(28, innerWidth - 10))
      ),
      innerWidth
    )
  );
  bodyLines.push("");
  for (const [index, item] of menuItems.entries()) {
    const selected = index === state.menuIndex;
    bodyLines.push(
      centerVisible(
        selected
          ? `${ANSI.gold}${ANSI.bold}▶ ${item.label}${ANSI.reset}`
          : item.label,
        innerWidth
      )
    );
  }
  return {
    title: "HOME",
    subtitle: hasPendingBuddy
      ? "Claude buddy control deck  Pending roll ready"
      : slotSummary.ready > 0
        ? "Claude buddy control deck  Breed slots ready"
        : slotSummary.incubating > 0
          ? "Claude buddy control deck  Breed slots incubating"
          : "Claude buddy control deck",
    bodyLines,
    footer: "Up/Down move  Enter select  Q quit",
    topRight: `${ANSI.dim}${collectionCount}/${maxBuddy} | ${chargeSnapshot.available}/${chargeSnapshot.maxCharges} | ${countdown}${ANSI.reset}`,
    status: state.statusMessage || "Ready to roll."
  };
}
