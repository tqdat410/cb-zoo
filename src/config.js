import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";

export const SALT = "friend-2026-401";
export const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
export const SPECIES = [
  "duck",
  "goose",
  "blob",
  "cat",
  "dragon",
  "octopus",
  "owl",
  "penguin",
  "turtle",
  "snail",
  "ghost",
  "axolotl",
  "capybara",
  "cactus",
  "robot",
  "rabbit",
  "mushroom",
  "chonk"
];
export const EYES = ["·", "✦", "×", "◉", "@", "°"];
export const HATS = ["none", "crown", "tophat", "propeller", "halo", "wizard", "beanie", "tinyduck"];
export const STAT_NAMES = ["DEBUGGING", "PATIENCE", "CHAOS", "WISDOM", "SNARK"];
export const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1
};
export const RARITY_FLOOR = {
  common: 5,
  uncommon: 15,
  rare: 25,
  epic: 35,
  legendary: 50
};
export const STARS = {
  common: "★",
  uncommon: "★★",
  rare: "★★★",
  epic: "★★★★",
  legendary: "★★★★★"
};
export const RARITY_ORDER = Object.fromEntries(RARITIES.map((rarity, index) => [rarity, index]));

function resolveHomeDir() {
  return process.env.CB_ZOO_HOME || homedir();
}

function normalizePath(pathValue) {
  const resolvedPath = resolve(pathValue).replace(/[\\/]+$/, "");
  return process.platform === "win32" ? resolvedPath.toLowerCase() : resolvedPath;
}

function isSameOrNestedPath(parentPath, childPath) {
  const normalizedParent = normalizePath(parentPath);
  const normalizedChild = normalizePath(childPath);
  return normalizedChild === normalizedParent || normalizedChild.startsWith(`${normalizedParent}${sep}`);
}

export function getClaudeDir() {
  return process.env.CB_ZOO_CLAUDE_DIR || join(resolveHomeDir(), ".claude");
}

export function getConfigFile() {
  return process.env.CB_ZOO_CONFIG_FILE || join(getClaudeDir(), ".config.json");
}

export function getDataDir() {
  const dataDir = process.env.CB_ZOO_DATA_DIR || join(resolveHomeDir(), ".cb-zoo");
  if (isSameOrNestedPath(getClaudeDir(), dataDir)) {
    throw new Error("CB_ZOO_DATA_DIR must stay outside the Claude config directory.");
  }
  return dataDir;
}

export function getBackupFile() {
  return join(getDataDir(), "backup.json");
}

export function getCollectionFile() {
  return join(getDataDir(), "collection.json");
}

export const CLAUDE_DIR = getClaudeDir();
export const CONFIG_FILE = getConfigFile();
export const CBZOO_DIR = getDataDir();
export const BACKUP_FILE = getBackupFile();
export const COLLECTION_FILE = getCollectionFile();
