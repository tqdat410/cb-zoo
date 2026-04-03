import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";

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
export const DEFAULT_BREED_SLOT_COUNT = 3;
export const DEFAULT_BREED_HATCH_TIMES = {
  common: 10_000,
  uncommon: 30_000,
  rare: 60_000,
  epic: 120_000,
  legendary: 300_000
};
export const EGG_HATCH_TIMES = DEFAULT_BREED_HATCH_TIMES;
export const EGG_COLORS = {
  common: "white",
  uncommon: "green",
  rare: "blue",
  epic: "purple",
  legendary: "gold"
};

function resolveHomeDir() {
  return process.env.CB_ZOO_HOME || homedir();
}

function getConfiguredClaudeStateDir() {
  return process.env.CB_ZOO_CLAUDE_DIR || process.env.CLAUDE_CONFIG_DIR || null;
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
  return getConfiguredClaudeStateDir() || join(resolveHomeDir(), ".claude");
}

function getWindowsClaudeConfigFile() {
  if (!process.env.APPDATA) {
    return null;
  }
  return join(process.env.APPDATA, "Claude", "config.json");
}

function getProtectedClaudeDataDirs() {
  const protectedDirs = [getClaudeDir()];
  const windowsClaudeConfigFile = getWindowsClaudeConfigFile();
  if (windowsClaudeConfigFile) {
    pushUniquePath(protectedDirs, dirname(windowsClaudeConfigFile));
  }
  return protectedDirs;
}

function pushUniquePath(paths, nextPath) {
  if (!nextPath) {
    return;
  }
  if (!paths.some((existingPath) => normalizePath(existingPath) === normalizePath(nextPath))) {
    paths.push(nextPath);
  }
}

export function getClaudeStateFileCandidates() {
  const explicitConfigFile = process.env.CB_ZOO_CONFIG_FILE;
  if (explicitConfigFile) {
    return [explicitConfigFile];
  }

  const configuredClaudeStateDir = getConfiguredClaudeStateDir();
  const candidates = [];
  if (configuredClaudeStateDir) {
    pushUniquePath(candidates, join(configuredClaudeStateDir, ".claude.json"));
    pushUniquePath(candidates, join(configuredClaudeStateDir, ".config.json"));
    return candidates;
  }

  const homeStateFile = join(resolveHomeDir(), ".claude.json");
  const legacyClaudeDir = join(resolveHomeDir(), ".claude");
  pushUniquePath(candidates, homeStateFile);
  pushUniquePath(candidates, join(legacyClaudeDir, ".config.json"));
  if (process.platform === "win32") {
    pushUniquePath(candidates, getWindowsClaudeConfigFile());
  }
  return candidates;
}

export function getPreferredClaudeStateFile() {
  return getClaudeStateFileCandidates()[0];
}

export function resolveClaudeStateFile() {
  return getClaudeStateFileCandidates().find((candidatePath) => existsSync(candidatePath)) || getPreferredClaudeStateFile();
}

export function isClaudeStateFileCandidate(filePath) {
  return getClaudeStateFileCandidates().some((candidatePath) => normalizePath(candidatePath) === normalizePath(filePath));
}

export function getConfigFile() {
  return resolveClaudeStateFile();
}

export function getDataDir() {
  const dataDir = process.env.CB_ZOO_DATA_DIR || join(resolveHomeDir(), ".cb-zoo");
  if (getProtectedClaudeDataDirs().some((protectedDir) => isSameOrNestedPath(protectedDir, dataDir))) {
    throw new Error("CB_ZOO_DATA_DIR must stay outside Claude config directories.");
  }
  return dataDir;
}

export function getSettingsFile() {
  return join(getDataDir(), "settings.json");
}

export function getCollectionFile() {
  return join(getDataDir(), "collection.json");
}

export const CLAUDE_DIR = getClaudeDir();
export const CONFIG_FILE = getConfigFile();
export const CLAUDE_STATE_FILE = resolveClaudeStateFile();
export const CBZOO_DIR = getDataDir();
export const SETTINGS_FILE = getSettingsFile();
export const COLLECTION_FILE = getCollectionFile();
