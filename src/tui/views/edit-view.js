import { getScreenMetrics } from "../render-layout.js";
import { ANSI, wrapText } from "../render-helpers.js";

function fieldLines(label, value, active, width) {
  const prefix = active ? `${ANSI.gold}${ANSI.bold}>${ANSI.reset}` : " ";
  const continuationPrefix = active ? `${ANSI.gold}>${ANSI.reset}` : " ";
  const valueWidth = Math.max(8, width - label.length - 4);
  const wrappedValue = wrapText(value || "", valueWidth);

  return [
    `${prefix} ${label}: ${wrappedValue[0] || ""}`,
    ...wrappedValue.slice(1).map((line) => `${continuationPrefix} ${" ".repeat(label.length + 2)}${line}`)
  ];
}

export function renderEditView(state, terminal = {}) {
  const { innerWidth } = getScreenMetrics(terminal);
  if (state.edit.confirmReset) {
    return {
      title: "EDIT PROFILE",
      subtitle: "Edit active buddy",
      bodyLines: [
        "Reset companion profile?",
        "",
        "Claude Code will regenerate name and personality",
        "from the current UUID on next launch.",
        "",
        "Current UUID stays unchanged."
      ],
      footer: "Enter/Y reset  Esc/N cancel",
      status: state.statusMessage || "Reset profile and return home."
    };
  }

  const fieldWidth = Math.max(24, innerWidth - 2);
  const personalityWidth = Math.max(20, innerWidth - 4);
  const bodyLines = [
    "Update the stored name and personality.",
    "",
    ...fieldLines("Name", state.edit.name, state.edit.activeField === "name", fieldWidth),
    ""
  ];
  bodyLines.push("  Personality:");
  for (const line of wrapText(state.edit.personality || "", personalityWidth)) {
    bodyLines.push(state.edit.activeField === "personality" ? `${ANSI.gold}>${ANSI.reset} ${line}` : `  ${line}`);
  }
  bodyLines.push("", "Press Enter to save when ready.", "Press R to reset and let Claude re-hatch from this UUID.");

  return {
    title: "EDIT PROFILE",
    subtitle: "Edit active buddy",
    bodyLines,
    footer: "Type  Tab switch  Enter save  R reset  Esc back",
    status: state.edit.error || state.statusMessage || "Stored profile only."
  };
}
