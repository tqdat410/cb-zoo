import { STARS } from "../../config.js";
import { showBuddyCard } from "../../gacha-animation.js";
import { renderSprite } from "../../sprites.js";
import { ANSI, centerVisible } from "../render-helpers.js";
import { ROLL_ACTIONS } from "../roll-config.js";

function renderAction(action, index, roll) {
  const label = action.label;
  const selected = index === roll.actionIndex;
  const accent = roll.previewColor || ANSI.gold;
  if (action.id === "add" && roll.savedToCollection) {
    return selected
      ? `${ANSI.bold}${ANSI.green}[${label}]${ANSI.reset}`
      : `${ANSI.green}${label}${ANSI.reset}`;
  }
  return selected ? `${ANSI.bold}${accent}[${label}]${ANSI.reset}` : label;
}

export function renderRollView(state) {
  const { roll } = state;
  const bodyLines = [];

  if (roll.phase === "spinning") {
    bodyLines.push(centerVisible(`${ANSI.dim}${ANSI.gray}Scanning capsule signal...${ANSI.reset}`, 50), "");
    bodyLines.push("");
    bodyLines.push(...renderSprite(roll.previewSpecies, roll.previewEye, "none").split("\n"));
    bodyLines.push("");
    bodyLines.push(centerVisible("░░░ READING SOUL BONES ░░░", 50));
  } else if (roll.phase === "rarity") {
    bodyLines.push("");
    bodyLines.push(centerVisible(`${ANSI.bold}${roll.previewColor}${roll.previewStars || STARS[roll.previewRarity]} ${roll.previewRarity.toUpperCase()}${ANSI.reset}`, 50));
    bodyLines.push("");
    bodyLines.push(centerVisible(`${roll.previewBurst}`, 50));
  } else if (roll.phase === "revealed" && roll.buddy) {
    bodyLines.push(centerVisible(`${ANSI.bold}${roll.previewColor}${roll.previewStars || STARS[roll.buddy.rarity]} ${roll.buddy.rarity.toUpperCase()}${ANSI.reset}`, 50));
    bodyLines.push("");
    bodyLines.push(...showBuddyCard(roll.buddy, { useAnsi: true }).split("\n"));
    bodyLines.push("");
    bodyLines.push(centerVisible(`${ANSI.dim}Equip = add + use now | Add = save only${ANSI.reset}`, 50));
    bodyLines.push("");
    bodyLines.push(
      ROLL_ACTIONS.map((action, index) => renderAction(action, index, roll)).join("   ")
    );
  } else {
    bodyLines.push("No active roll.");
  }

  return {
    title: "ROLL STAGE",
    subtitle: "Handheld reveal chamber",
    bodyLines,
    footer: roll.phase === "revealed" ? "<-/-> move  Enter go  E equip  A add  R reroll  Esc/B back" : "Please wait...",
    palette: roll.previewColor || ANSI.cyan,
    status: state.statusMessage || "Rolling."
  };
}
