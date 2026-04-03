import { showBuddyCard } from "../../gacha-animation.js";
import { renderSprite } from "../../sprites.js";
import { BREED_HATCH_ACTIONS } from "../breed-state.js";
import { ANSI, centerBlockLines, centerUniformBlockLines, createBoxLines, getRarityAccent, withAnsiColor, withPersistentAnsiColor } from "../render-helpers.js";
import { getScreenMetrics } from "../render-layout.js";

const EGG_ART = {
  common: ["  ___", "  /   \\", " |     |", " |  ·  |", "  \\___/"],
  uncommon: ["  ___", "  /+++\\", " | ++  |", " |  ++ |", "  \\___/"],
  rare: ["  ___", "  /~~~\\", " | ~ ~ |", " |  ~~ |", "  \\___/"],
  epic: ["  ___", "  /^^^\\", " | ^^  |", " |  ^^ |", "  \\___/"],
  legendary: ["  ___", "  /%%%\\", " |%%%%%|", " |%% %%|", "  \\%%%/"]
};

function formatCountdown(hatchAt) {
  const remaining = Math.max(0, hatchAt - Date.now());
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

function tintEgg(rarity) {
  const accent = getRarityAccent(rarity).color;
  return (EGG_ART[rarity] || EGG_ART.common).map((line) => withAnsiColor(line, accent));
}

function formatLineageLabel(state) {
  const { egg, parentA, parentB } = state.breed;
  const left = parentA?.species || egg?.parentA?.slice(0, 8) || "parent-a";
  const right = parentB?.species || egg?.parentB?.slice(0, 8) || "parent-b";
  return `${left} × ${right}`;
}

function isBlockedAction(state, actionId) {
  return state.breed.collectionFull && (actionId === "equip" || actionId === "add");
}

function renderAction(state, action, index, accent) {
  const selected = index === state.breed.hatchActionIndex;
  if (isBlockedAction(state, action.id)) {
    return selected
      ? `${ANSI.dim}${ANSI.red}[${action.label} - full]${ANSI.reset}`
      : `${ANSI.dim}${action.label} - full${ANSI.reset}`;
  }
  if (action.id === "delete") {
    return selected
      ? `${ANSI.bold}${ANSI.red}[${action.label}]${ANSI.reset}`
      : `${ANSI.red}${action.label}${ANSI.reset}`;
  }
  return selected ? `${ANSI.bold}${accent}[${action.label}]${ANSI.reset}` : action.label;
}

function buildSlotSubtitle(baseLabel, slotIndex) {
  return slotIndex >= 0 ? `${baseLabel}  Slot ${slotIndex + 1}` : baseLabel;
}

export function renderEggView(state, terminal = {}) {
  const { innerWidth } = getScreenMetrics(terminal);
  const egg = state.breed.egg;
  const accent = getRarityAccent(egg?.rarity).color || ANSI.cyan;
  const heading = egg && Date.now() >= egg.hatchAt
    ? `${ANSI.bold}${accent}READY TO HATCH${ANSI.reset}`
    : `${ANSI.bold}${accent}${egg?.rarity?.toUpperCase() || "MYSTERY"} EGG${ANSI.reset}`;
  const details = egg
    ? [
        `Lineage: ${formatLineageLabel(state)}`,
        `Hatching in ${formatCountdown(egg.hatchAt)}`
      ]
    : ["No egg in incubator."];

  return {
    title: "EGG",
    subtitle: buildSlotSubtitle("Incubating buddy", state.breed.slotIndex),
    bodyLines: [
      ...centerBlockLines([heading], innerWidth),
      "",
      ...centerBlockLines(tintEgg(egg?.rarity), innerWidth),
      "",
      ...centerBlockLines(createBoxLines(details, Math.min(44, Math.max(24, innerWidth - 8))), innerWidth)
    ],
    footer: Date.now() >= (egg?.hatchAt || 0) ? "Waiting...  Esc home" : "Waiting...  Esc home",
    palette: accent,
    status: state.statusMessage || "Egg timer is persisted in settings."
  };
}

export function renderHatchView(state, terminal = {}) {
  const { innerWidth } = getScreenMetrics(terminal);
  const buddy = state.breed.hatchedBuddy;
  const accent = getRarityAccent(buddy?.rarity).color || ANSI.cyan;
  const actionLine = BREED_HATCH_ACTIONS.map((action, index) => renderAction(state, action, index, accent)).join("   ");
  const buddyCardLines = buddy
    ? showBuddyCard(buddy, { useAnsi: true }).split("\n")
    : ["Hatching failed."];
  const lineageLine = buddy
    ? withPersistentAnsiColor(`Bred from ${formatLineageLabel(state)}`, accent)
    : "Hatching failed.";

  return {
    title: "HATCH",
    subtitle: buildSlotSubtitle("Egg reveal", state.breed.slotIndex),
    bodyLines: [
      ...centerBlockLines([`${ANSI.bold}${accent}EGG HATCHED${ANSI.reset}`], innerWidth),
      "",
      ...centerUniformBlockLines(buddyCardLines, innerWidth),
      "",
      ...centerBlockLines([lineageLine], innerWidth),
      "",
      ...centerBlockLines([
        state.breed.collectionFull
          ? `${ANSI.dim}${ANSI.red}Collection full. Add and equip are blocked until a slot opens.${ANSI.reset}`
          : `${ANSI.dim}Equip = save + apply | Add = collection only | Delete = discard${ANSI.reset}`,
        actionLine
      ], innerWidth)
    ],
    footer: state.breed.collectionFull
      ? "Left/Right move  Enter go  D discard  Esc home"
      : "Left/Right move  Enter go  E equip  A add  D discard  Esc home",
    palette: accent,
    status: state.statusMessage || "Choose whether to add, equip, or delete this hatched buddy."
  };
}
