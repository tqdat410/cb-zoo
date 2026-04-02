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
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  bgBlue: "\x1b[44m",
  bgGold: "\x1b[43m",
  bgGray: "\x1b[100m"
};

const RARITY_COLORS = {
  common: ANSI.gray,
  uncommon: ANSI.green,
  rare: ANSI.cyan,
  epic: ANSI.magenta,
  legendary: ANSI.gold
};

const RARITY_BURSTS = {
  common: "· · · · · · · ·",
  uncommon: "★ ★ ★ ★ ★ ★ ★ ★",
  rare: "✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦",
  epic: "✦ ★ ✦ ★ ✦ ★ ✦ ★",
  legendary: "✦✦✦✦✦✦✦✦✦✦✦✦"
};

export function getRarityAccent(rarity) {
  return {
    color: RARITY_COLORS[rarity] || ANSI.cyan,
    stars: STARS[rarity] || "",
    burst: RARITY_BURSTS[rarity] || "★ ★ ★ ★ ★ ★ ★ ★"
  };
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
