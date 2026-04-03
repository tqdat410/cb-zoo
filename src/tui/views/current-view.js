import { rollFrom } from "../../buddy-engine.js";
import { showBuddyCard } from "../../gacha-animation.js";
import { formatCompanionSummary } from "../../companion-state.js";
import { getScreenMetrics } from "../render-layout.js";
import { centerUniformBlockLines, getRarityAccent } from "../render-helpers.js";

export function renderCurrentView(state, terminal = {}) {
  const buddy = state.currentCompanion ? rollFrom(state.currentCompanion.uuid) : state.currentBuddy;
  const content = state.currentCompanion
    ? formatCompanionSummary(state.currentCompanion, { useAnsi: true })
    : showBuddyCard(state.currentBuddy, { useAnsi: true });
  const { innerWidth } = getScreenMetrics(terminal);

  return {
    title: "CURRENT",
    subtitle: state.currentCompanion ? "Stored profile + UUID bones" : "Live UUID snapshot",
    bodyLines: centerUniformBlockLines(content.split("\n"), innerWidth),
    footer: "E edit  Esc back",
    status: state.statusMessage || "Inspect the active buddy.",
    palette: buddy ? getRarityAccent(buddy.rarity).color : undefined
  };
}
