import { ANSI, centerVisible, clipLines, padVisible } from "./render-helpers.js";

export function renderHandheldScreen(view, terminal = {}) {
  const columns = Math.max(64, terminal.columns ?? process.stdout.columns ?? 80);
  const rows = Math.max(24, terminal.rows ?? process.stdout.rows ?? 24);
  const width = Math.max(60, Math.min(78, columns - 2));
  const innerWidth = width - 4;
  const bodyHeight = Math.max(10, rows - 9);
  const palette = view.palette || ANSI.cyan;
  const topBar = `${ANSI.bold}${palette}CB-ZOO // HANDHELD${ANSI.reset}`;
  const title = view.title ? `${ANSI.bold}${view.title}${ANSI.reset}` : "";
  const subtitle = view.subtitle || "";
  const status = view.status || "";
  const footer = view.footer || "Arrows move  Enter confirm  Esc back  Q quit";
  const bodyLines = clipLines(view.bodyLines || [], bodyHeight);

  const lines = [
    `╭${"─".repeat(width - 2)}╮`,
    `│ ${padVisible(topBar, innerWidth)} │`,
    `│ ${padVisible(title, innerWidth)} │`,
    `│ ${padVisible(subtitle, innerWidth)} │`,
    `├${"─".repeat(width - 2)}┤`,
    ...bodyLines.map((line) => `│ ${padVisible(line, innerWidth)} │`),
    `├${"─".repeat(width - 2)}┤`,
    `│ ${padVisible(status, innerWidth)} │`,
    `│ ${padVisible(centerVisible(footer, innerWidth), innerWidth)} │`,
    `╰${"─".repeat(width - 2)}╯`
  ];

  return `${ANSI.bgBlue}\x1b[2J\x1b[H${lines.join("\n")}${ANSI.reset}`;
}
