import { STARS } from "../../config.js";
import { showBuddyCard } from "../../gacha-animation.js";
import { formatRollCountdown, getRollChargeSnapshot } from "../../roll-charge-manager.js";
import { renderSprite } from "../../sprites.js";
import { loadCollection } from "../../collection.js";
import { getMaxBuddy } from "../../settings-manager.js";
import { getScreenMetrics } from "../render-layout.js";
import { ANSI, centerBlockLines, centerUniformBlockLines, centerVisible } from "../render-helpers.js";
import { ROLL_ACTIONS } from "../roll-config.js";

function isBlockedAction(action, roll, chargeSnapshot) {
  if (action.id === "reroll" && chargeSnapshot.available <= 0) {
    return true;
  }
  return roll.collectionFull && !roll.savedToCollection && (action.id === "equip" || action.id === "add");
}

function renderAction(action, index, roll, chargeSnapshot) {
  const label = action.label;
  const selected = index === roll.actionIndex;
  const accent = roll.previewColor ?? ANSI.gold;
  if (action.id === "reroll" && chargeSnapshot.available <= 0) {
    return selected
      ? `${ANSI.dim}${ANSI.yellow}[${label} - empty]${ANSI.reset}`
      : `${ANSI.dim}${label} - empty${ANSI.reset}`;
  }
  if (isBlockedAction(action, roll, chargeSnapshot)) {
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
  const topRightSnapshot = getRollChargeSnapshot();
  const chargeSnapshot = roll.phase === "revealed" ? topRightSnapshot : null;
  const collectionCount = loadCollection().length;
  const countdown = topRightSnapshot.isFull ? "--:--" : formatRollCountdown(topRightSnapshot.msUntilNext);

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
          ? chargeSnapshot.available > 0
            ? `${ANSI.dim}${ANSI.red}Collection full. Reroll or delete a buddy first.${ANSI.reset}`
            : `${ANSI.dim}${ANSI.red}Collection full. Next reroll in ${formatRollCountdown(chargeSnapshot.msUntilNext)}.${ANSI.reset}`
          : chargeSnapshot.available > 0
            ? `${ANSI.dim}Equip = save + apply | Add = collection only${ANSI.reset}`
            : `${ANSI.dim}${ANSI.yellow}No rerolls left. Next +1 in ${formatRollCountdown(chargeSnapshot.msUntilNext)}.${ANSI.reset}`
      )
    );
    bodyLines.push("");
    bodyLines.push(centerLine(ROLL_ACTIONS.map((action, index) => renderAction(action, index, roll, chargeSnapshot)).join("   ")));
  } else {
    bodyLines.push("No active reveal.");
  }

  const revealFooter = chargeSnapshot
    ? roll.collectionFull && !roll.savedToCollection
      ? chargeSnapshot.available > 0
        ? "Arrows move  Enter go  R reroll  Esc back"
        : "Arrows move  Enter go  Esc back"
      : chargeSnapshot.available > 0
        ? "Arrows move  Enter go  E equip  A add  R reroll  Esc back"
        : "Arrows move  Enter go  E equip  A add  Esc back"
    : "Please wait...";

  return {
    title: "ROLL",
    subtitle: "Claude buddy reveal",
    bodyLines,
    footer: roll.phase === "revealed" ? revealFooter : "Please wait...",
    palette: roll.previewColor ?? ANSI.cyan,
    topRight: `${ANSI.dim}${collectionCount}/${getMaxBuddy()} | ${topRightSnapshot.available}/${topRightSnapshot.maxCharges} | ${countdown}${ANSI.reset}`,
    status: state.statusMessage || "Reveal in progress."
  };
}
