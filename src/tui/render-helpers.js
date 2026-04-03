import { STARS } from "../config.js";

export const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  gold: "\x1b[33m",
  epic: "\x1b[38;2;190;39;167m",
  legendary: "\x1b[38;2;255;170;0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  bgBlue: "\x1b[44m",
  bgGold: "\x1b[43m",
  bgGray: "\x1b[100m"
};

const DEFAULT_RARITY_ACCENT = Object.freeze({
  color: ANSI.cyan,
  stars: "",
  burst: "★ ★ ★ ★ ★ ★ ★ ★"
});

const RARITY_ACCENTS = Object.freeze({
  common: Object.freeze({
    color: "",
    stars: STARS.common || "",
    burst: "· · · · · · · ·"
  }),
  uncommon: Object.freeze({
    color: ANSI.green,
    stars: STARS.uncommon || "",
    burst: "★ ★ ★ ★ ★ ★ ★ ★"
  }),
  rare: Object.freeze({
    color: ANSI.blue,
    stars: STARS.rare || "",
    burst: "✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦"
  }),
  epic: Object.freeze({
    color: ANSI.epic,
    stars: STARS.epic || "",
    burst: "✦ ★ ✦ ★ ✦ ★ ✦ ★"
  }),
  legendary: Object.freeze({
    color: ANSI.legendary,
    stars: STARS.legendary || "",
    burst: "✦✦✦✦✦✦✦✦✦✦✦✦"
  })
});

export function getRarityAccent(rarity) {
  return RARITY_ACCENTS[rarity] ?? DEFAULT_RARITY_ACCENT;
}

export function withAnsiColor(value, color) {
  return color ? `${color}${value}${ANSI.reset}` : value;
}

export function withPersistentAnsiColor(value, color) {
  if (!color) {
    return value;
  }
  return `${color}${value.replaceAll(ANSI.reset, `${ANSI.reset}${color}`)}${ANSI.reset}`;
}

export function stripAnsi(value) {
  return value.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");
}

export function padVisible(value, width) {
  const visibleLength = stripAnsi(value).length;
  return `${value}${" ".repeat(Math.max(0, width - visibleLength))}`;
}

export function centerVisible(value, width) {
  const visibleLength = stripAnsi(value).length;
  const padding = Math.max(0, Math.floor((width - visibleLength) / 2));
  return `${" ".repeat(padding)}${value}`;
}

export function centerBlockLines(lines, width) {
  return lines.map((line) => centerVisible(line, width));
}

export function centerUniformBlockLines(lines, width) {
  const maxVisibleWidth = Math.max(0, ...lines.map((line) => stripAnsi(line).length));
  const padding = Math.max(0, Math.floor((width - maxVisibleWidth) / 2));
  return lines.map((line) => `${" ".repeat(padding)}${line}`);
}

export function createBoxLines(lines, contentWidth) {
  const safeContentWidth = Math.max(8, contentWidth);
  const wrappedLines = lines.flatMap((line) => {
    if (!line) {
      return [""];
    }
    return wrapText(line, safeContentWidth);
  });
  const measuredWidth = Math.max(1, ...wrappedLines.map((line) => stripAnsi(line).length));
  return [
    `┌${"─".repeat(measuredWidth + 2)}┐`,
    ...wrappedLines.map((line) => `│ ${padVisible(line, measuredWidth)} │`),
    `└${"─".repeat(measuredWidth + 2)}┘`
  ];
}

export function wrapText(value, width) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }
  const lines = [];
  let current = "";
  for (const word of words) {
    if (stripAnsi(word).length > width) {
      if (current) {
        lines.push(current);
        current = "";
      }
      let remainder = word;
      while (stripAnsi(remainder).length > width) {
        lines.push(remainder.slice(0, width));
        remainder = remainder.slice(width);
      }
      current = remainder;
      continue;
    }
    const next = current ? `${current} ${word}` : word;
    if (stripAnsi(next).length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

export function clipLines(lines, height) {
  if (lines.length <= height) {
    return [...lines, ...Array.from({ length: height - lines.length }, () => "")];
  }
  if (height <= 0) {
    return [];
  }
  const clipped = lines.slice(0, Math.max(0, height - 1));
  clipped.push("...");
  return clipped;
}
