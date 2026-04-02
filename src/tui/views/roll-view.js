import { STARS } from "../../config.js";
import { showBuddyCard } from "../../gacha-animation.js";
import { renderSprite } from "../../sprites.js";
import { ANSI, centerVisible } from "../render-helpers.js";

const ACTIONS = ["Apply", "Reroll", "Back"];

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
    bodyLines.push(centerVisible(`${ANSI.bold}${roll.previewColor}${STARS[roll.previewRarity]} ${roll.previewRarity.toUpperCase()}${ANSI.reset}`, 50));
    bodyLines.push("");
    bodyLines.push(centerVisible(`${roll.previewBurst}`, 50));
  } else if (roll.phase === "revealed" && roll.buddy) {
    bodyLines.push(...showBuddyCard(roll.buddy, { useAnsi: true }).split("\n"));
    bodyLines.push("");
    bodyLines.push(
      ACTIONS.map((action, index) =>
        index === roll.actionIndex ? `${ANSI.gold}[${action}]${ANSI.reset}` : action
      ).join("   ")
    );
  } else {
    bodyLines.push("No active roll.");
  }

  return {
    title: "ROLL STAGE",
    subtitle: "Handheld reveal chamber",
    bodyLines,
    footer: roll.phase === "revealed" ? "Left/Right move  Enter confirm  Esc back" : "Please wait...",
    status: state.statusMessage || "Rolling."
  };
}
