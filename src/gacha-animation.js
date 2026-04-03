import { STARS, SPECIES } from "./config.js";
import { hashString, mulberry32, pick } from "./buddy-engine.js";
import { renderSprite } from "./sprites.js";
import { ANSI, getRarityAccent, withAnsiColor, withPersistentAnsiColor } from "./tui/render-helpers.js";

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H");
}

function hideCursor() {
  process.stdout.write("\x1b[?25l");
}

function showCursor() {
  process.stdout.write("\x1b[?25h");
}

function stripAnsi(value) {
  return value.replace(/\x1b\[[0-9;]*m/g, "");
}

function center(text, width = 42) {
  const clean = stripAnsi(text);
  const padding = Math.max(0, Math.floor((width - clean.length) / 2));
  return `${" ".repeat(padding)}${text}`;
}

function centerBlock(text, width = 42) {
  return text
    .split("\n")
    .map((line) => center(line, width))
    .join("\n");
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function padLine(value, width) {
  const visibleLength = stripAnsi(value).length;
  return `${value}${" ".repeat(Math.max(0, width - visibleLength))}`;
}

function renderStatBar(value, useAnsi) {
  const filled = Math.max(0, Math.min(10, Math.floor(value / 10)));
  const bar = `${"█".repeat(filled)}${"░".repeat(10 - filled)}`;
  if (!useAnsi) {
    return bar;
  }
  const color = value < 30 ? ANSI.red : value <= 60 ? ANSI.yellow : ANSI.green;
  return `${color}${bar}${ANSI.reset}`;
}

function rarityLabel(rarity) {
  return `${STARS[rarity]} ${rarity.toUpperCase()}`;
}

export function showBuddyCard(buddy, options = {}) {
  const useAnsi = options.useAnsi ?? supportsAnsi();
  const sprite = renderSprite(buddy).split("\n");
  const rarityLine = `${rarityLabel(buddy.rarity)} ${titleCase(buddy.species)}`;
  const rarityAccent = getRarityAccent(buddy.rarity).color;
  const tintLine = (line) => (useAnsi ? withPersistentAnsiColor(line, rarityAccent) : line);
  const sideBorder = useAnsi ? withAnsiColor("║", rarityAccent) : "║";
  const lines = [
    ` ${tintLine(`${ANSI.bold}${rarityLine}${ANSI.reset}`)}`,
    "",
    ...sprite.map((line) => tintLine(`   ${line}`)),
    "",
    tintLine(` Eyes: ${buddy.eye}  Hat: ${buddy.hat}  Shiny: ${buddy.shiny ? "yes" : "no"}`),
    ""
  ];

  for (const [name, value] of Object.entries(buddy.stats)) {
    lines.push(tintLine(` ${name.padEnd(10)} ${renderStatBar(value, useAnsi)} ${String(value).padStart(3)}`));
  }

  lines.push("", tintLine(` Peak: ${buddy.peak}  Dump: ${buddy.dump}`), tintLine(` Total: ${buddy.total}`));
  const width = 44;
  const horizontalBorder = "═".repeat(width + 2);
  const topBorder = useAnsi ? withAnsiColor(`╔${horizontalBorder}╗`, rarityAccent) : `╔${horizontalBorder}╗`;
  const bottomBorder = useAnsi ? withAnsiColor(`╚${horizontalBorder}╝`, rarityAccent) : `╚${horizontalBorder}╝`;
  return [
    topBorder,
    ...lines.map((line) => `${sideBorder} ${padLine(line, width)} ${sideBorder}`),
    bottomBorder
  ].join("\n");
}

async function spinPhase(buddy) {
  const rng = mulberry32(hashString(`${buddy.uuid}:spin`));
  const frames = [45, 50, 55, 60, 65, 70, 75, 80, 90, 100, 110, 120];
  for (const delay of frames) {
    const species = pick(rng, SPECIES);
    clearScreen();
    process.stdout.write(`${center(`${ANSI.dim}${ANSI.gray}Rolling buddy capsule...${ANSI.reset}`)}\n\n`);
    process.stdout.write(
      `${centerBlock(`${ANSI.dim}${renderSprite(species, pick(rng, ["·", "✦", "×", "◉", "@", "°"]), "none")}${ANSI.reset}`)}\n`
    );
    await sleep(delay);
  }
}

async function rarityReveal(rarity) {
  const color = getRarityAccent(rarity).color;
  const burst = rarity === "legendary" ? "✦".repeat(18) : "★".repeat(12);
  clearScreen();
  process.stdout.write(`${center(`${color}${ANSI.bold}${burst}${ANSI.reset}`)}\n\n`);
  process.stdout.write(`${center(`${color}${ANSI.bold}${rarity.toUpperCase()}${ANSI.reset}`)}\n\n`);
  process.stdout.write(`${center(`${color}${ANSI.bold}${burst}${ANSI.reset}`)}\n`);
  await sleep(rarity === "legendary" ? 650 : 450);
}

async function buddyReveal(buddy) {
  clearScreen();
  if (!buddy.shiny) {
    process.stdout.write(`${showBuddyCard(buddy, { useAnsi: true })}\n`);
    await sleep(500);
    return;
  }
  const rainbow = [ANSI.red, ANSI.yellow, ANSI.green, ANSI.cyan, ANSI.magenta];
  for (const color of rainbow) {
    clearScreen();
    process.stdout.write(`${center(`${color}${ANSI.bold}SHINY HATCH!${ANSI.reset}`)}\n\n`);
    process.stdout.write(`${color}${showBuddyCard(buddy, { useAnsi: true })}${ANSI.reset}\n`);
    await sleep(120);
  }
  clearScreen();
  process.stdout.write(`${showBuddyCard(buddy, { useAnsi: true })}\n`);
}

export function supportsAnsi() {
  if (process.env.NO_COLOR !== undefined || process.env.FORCE_COLOR === "0") {
    return false;
  }
  if (process.env.FORCE_COLOR && process.env.FORCE_COLOR !== "0") {
    return true;
  }
  return Boolean(process.stdout.isTTY && process.stdout.hasColors?.());
}

export async function animateGacha(buddy) {
  if (!supportsAnsi()) {
    quickReveal(buddy);
    return;
  }
  hideCursor();
  try {
    await spinPhase(buddy);
    await rarityReveal(buddy.rarity);
    await buddyReveal(buddy);
  } finally {
    showCursor();
  }
}

export function quickReveal(buddy) {
  process.stdout.write(`${showBuddyCard(buddy, { useAnsi: supportsAnsi() })}\n`);
}
