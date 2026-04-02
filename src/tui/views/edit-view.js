import { ANSI, wrapText } from "../render-helpers.js";

function fieldLine(label, value, active) {
  const prefix = active ? `${ANSI.gold}${ANSI.bold}>${ANSI.reset}` : " ";
  return `${prefix} ${label}: ${value}`;
}

export function renderEditView(state) {
  const bodyLines = [
    "Edit the stored buddy metadata.",
    "",
    fieldLine("Name", state.edit.name, state.edit.activeField === "name"),
    ""
  ];
  bodyLines.push("  Personality:");
  for (const line of wrapText(state.edit.personality || "", 42)) {
    bodyLines.push(state.edit.activeField === "personality" ? `${ANSI.gold}>${ANSI.reset} ${line}` : `  ${line}`);
  }
  bodyLines.push("", "Press Enter to save when ready.");

  return {
    title: "EDIT BUDDY",
    subtitle: "Handheld nickname editor",
    bodyLines,
    footer: "Type text  Tab switch  Backspace erase  Enter save  Esc back",
    status: state.edit.error || state.statusMessage || "Name and personality only."
  };
}
