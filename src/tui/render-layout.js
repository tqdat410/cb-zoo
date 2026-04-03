import { ANSI, centerVisible, clipLines, padVisible, stripAnsi, withAnsiColor } from "./render-helpers.js";

export function getScreenMetrics(terminal = {}) {
  const columns = Math.max(1, terminal.columns ?? process.stdout.columns ?? 80);
  const rows = Math.max(1, terminal.rows ?? process.stdout.rows ?? 24);
  const width = Math.max(60, Math.min(74, columns - 4));
  const innerWidth = width - 4;
  const bodyHeight = Math.max(10, rows - 8);
  const leftPad = " ".repeat(Math.max(0, Math.floor((columns - width) / 2)));
  return { columns, rows, width, innerWidth, bodyHeight, leftPad };
}

function renderTopRow(left, right, width) {
  if (!right) {
    return padVisible(left, width);
  }
  const leftLength = stripAnsi(left).length;
  const rightLength = stripAnsi(right).length;
  const gap = Math.max(1, width - leftLength - rightLength);
  return `${left}${" ".repeat(gap)}${right}`;
}

export function renderHandheldScreen(view, terminal = {}) {
  const { columns, rows, width, innerWidth, bodyHeight, leftPad } = getScreenMetrics(terminal);
  if (columns < 64 || rows < 24) {
    return `\x1b[2J\x1b[HTerminal too small for cb-zoo.\nNeed at least 64x24.\n${ANSI.reset}`;
  }
  const palette = "palette" in view ? view.palette : ANSI.cyan;
  const topBar = `${ANSI.bold}${palette}CB-ZOO // BUDDY CONSOLE${ANSI.reset}`;
  const topRight = view.topRight || "";
  const title = view.title ? withAnsiColor(`${ANSI.bold}${view.title}${ANSI.reset}`, palette) : "";
  const subtitle = view.subtitle || "";
  const footer = view.footer || "Arrows move  Enter confirm  Esc back  Q quit";
  const bodyLines = clipLines(view.bodyLines || [], bodyHeight);

  const lines = [
    `╭${"─".repeat(width - 2)}╮`,
    `│ ${renderTopRow(topBar, topRight, innerWidth)} │`,
    `│ ${padVisible(title, innerWidth)} │`,
    `│ ${padVisible(subtitle, innerWidth)} │`,
    `├${"─".repeat(width - 2)}┤`,
    ...bodyLines.map((line) => `│ ${padVisible(line, innerWidth)} │`),
    `├${"─".repeat(width - 2)}┤`,
    `│ ${padVisible(centerVisible(footer, innerWidth), innerWidth)} │`,
    `╰${"─".repeat(width - 2)}╯`
  ];

  return `\x1b[2J\x1b[H${lines.map((line) => `${leftPad}${line}`).join("\n")}${ANSI.reset}`;
}
