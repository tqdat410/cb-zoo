import { STARS } from "../../config.js";
import { showBuddyCard } from "../../gacha-animation.js";
import { renderSprite } from "../../sprites.js";
import { getScreenMetrics } from "../render-layout.js";
import { ANSI, centerBlockLines, centerUniformBlockLines, centerVisible } from "../render-helpers.js";
import { ROLL_ACTIONS } from "../roll-config.js";

function isBlockedAction(action, roll) {
  return roll.collectionFull && !roll.savedToCollection && (action.id === "equip" || action.id === "add");
}

function renderAction(action, index, roll) {
  const label = action.label;
  const selected = index === roll.actionIndex;
  const accent = roll.previewColor ?? ANSI.gold;
  if (isBlockedAction(action, roll)) {
    return selected
      ? `${ANSI.dim}${ANSI.red}[${label} - full]${ANSI.reset}`
      : `${ANSI.dim}${label} - full${ANSI.reset}`;
  }
  if (action.id === "add" && roll.savedToCollection) {
    return selected
      ? `${ANSI.bold}${ANSI.green}[${label}]${ANSI.reset}`
      : `${ANSI.green}${label}${ANSI.reset}`;
  }
  return selected ? `${ANSI.bold}${accent}[${label}]${ANSI.reset}` : label;
}

export function renderRollView(state, terminal = {}) {
  const { roll } = state;
  const { innerWidth } = getScreenMetrics(terminal);
  const bodyLines = [];
  const centerLine = (line) => centerVisible(line, innerWidth);

  if (roll.phase === "spinning") {
    bodyLines.push(centerLine(`${ANSI.dim}${ANSI.gray}Reading Claude state...${ANSI.reset}`));
    bodyLines.push("");
    bodyLines.push(...centerBlockLines(renderSprite(roll.previewSpecies, roll.previewEye, "none").split("\n"), innerWidth));
    bodyLines.push("");
    bodyLines.push(centerLine("░░░ DERIVING BUDDY PROFILE ░░░"));
  } else if (roll.phase === "rarity") {
    bodyLines.push("");
    bodyLines.push(centerLine(`${ANSI.bold}${roll.previewColor}${roll.previewStars || STARS[roll.previewRarity]} ${roll.previewRarity.toUpperCase()}${ANSI.reset}`));
    bodyLines.push("");
    bodyLines.push(centerLine(`${roll.previewBurst}`));
  } else if (roll.phase === "revealed" && roll.buddy) {
    bodyLines.push(centerLine(`${ANSI.bold}${roll.previewColor}${roll.previewStars || STARS[roll.buddy.rarity]} ${roll.buddy.rarity.toUpperCase()}${ANSI.reset}`));
    bodyLines.push(...centerUniformBlockLines(showBuddyCard(roll.buddy, { useAnsi: true }).split("\n"), innerWidth));
    bodyLines.push("");
    bodyLines.push(
      centerLine(
        roll.collectionFull && !roll.savedToCollection
          ? `${ANSI.dim}${ANSI.red}Collection full. Reroll or delete a buddy first.${ANSI.reset}`
          : `${ANSI.dim}Equip = save + apply | Add = collection only${ANSI.reset}`
      )
    );
    bodyLines.push("");
    bodyLines.push(centerLine(ROLL_ACTIONS.map((action, index) => renderAction(action, index, roll)).join("   ")));
  } else {
    bodyLines.push("No active reveal.");
  }

  return {
    title: "ROLL",
    subtitle: "Claude buddy reveal",
    bodyLines,
    footer:
      roll.phase === "revealed"
        ? roll.collectionFull && !roll.savedToCollection
          ? "Arrows move  Enter go  R reroll  Esc back"
          : "Arrows move  Enter go  E equip  A add  Esc back"
        : "Please wait...",
    palette: roll.previewColor ?? ANSI.cyan,
    status: state.statusMessage || "Reveal in progress."
  };
}
