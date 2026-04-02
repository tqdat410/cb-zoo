import { showBuddyCard } from "../../gacha-animation.js";
import { formatCompanionSummary } from "../../companion-state.js";

export function renderCurrentView(state) {
  const content = state.currentCompanion
    ? formatCompanionSummary(state.currentCompanion)
    : showBuddyCard(state.currentBuddy, { useAnsi: true });

  return {
    title: "CURRENT",
    subtitle: state.currentCompanion ? "Stored soul + UUID bones" : "UUID bones only",
    bodyLines: content.split("\n"),
    footer: "E edit  Esc back",
    status: state.statusMessage || "Inspect your buddy."
  };
}
