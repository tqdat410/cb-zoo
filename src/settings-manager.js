import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RARITIES, SPECIES, getDataDir, getSettingsFile } from "./config.js";
import { isUuid } from "./claude-state.js";

export const DEFAULT_MAX_BUDDY = 50;

function stripUtf8Bom(content) {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function getLegacyBackupFile() {
  return join(getDataDir(), "backup.json");
}

function readJsonObject(filePath, label) {
  try {
    const parsed = JSON.parse(stripUtf8Bom(readFileSync(filePath, "utf8")));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`${label} must contain a JSON object.`);
    }
    return parsed;
  } catch (error) {
    throw new Error(`cb-zoo ${label.toLowerCase()} exists but is invalid. Fix or delete ${filePath.split(/[\\/]/).at(-1)} before continuing. ${error.message}`);
  }
}

function normalizeBackupData(backup, { strict = false } = {}) {
  if (backup == null) {
    return null;
  }
  if (!backup || typeof backup !== "object" || Array.isArray(backup)) {
    if (strict) {
      throw new Error("Backup data must be a JSON object.");
    }
    return null;
  }
  if (!isUuid(backup.uuid)) {
    if (strict) {
      throw new Error("Backup data is missing a valid UUID.");
    }
    return null;
  }
  if (backup.stateFile !== undefined && typeof backup.stateFile !== "string") {
    if (strict) {
      throw new Error("Backup data contains an invalid stateFile path.");
    }
    return null;
  }
  if (backup.backedUpAt !== undefined && typeof backup.backedUpAt !== "string") {
    if (strict) {
      throw new Error("Backup data contains an invalid backedUpAt value.");
    }
    return null;
  }
  return {
    uuid: backup.uuid,
    ...(backup.stateFile ? { stateFile: backup.stateFile } : {}),
    ...(backup.backedUpAt ? { backedUpAt: backup.backedUpAt } : {})
  };
}

function isPendingBuddy(buddy) {
  return (
    buddy &&
    typeof buddy === "object" &&
    !Array.isArray(buddy) &&
    isUuid(buddy.uuid) &&
    SPECIES.includes(buddy.species) &&
    RARITIES.includes(buddy.rarity) &&
    typeof buddy.eye === "string" &&
    typeof buddy.hat === "string" &&
    typeof buddy.shiny === "boolean" &&
    Number.isFinite(buddy.total) &&
    (buddy.rolledAt === undefined || typeof buddy.rolledAt === "string")
  );
}

function normalizePendingBuddy(pendingBuddy) {
  return isPendingBuddy(pendingBuddy) ? pendingBuddy : null;
}

function toStoredPendingBuddy(buddy) {
  const pendingBuddy = {
    uuid: buddy?.uuid,
    species: buddy?.species,
    rarity: buddy?.rarity,
    eye: buddy?.eye,
    hat: buddy?.hat,
    shiny: buddy?.shiny,
    total: buddy?.total,
    rolledAt: buddy?.rolledAt || new Date().toISOString()
  };
  if (!isPendingBuddy(pendingBuddy)) {
    throw new Error("Refusing to save invalid pending buddy data.");
  }
  return pendingBuddy;
}

function normalizeMaxBuddy(maxBuddy) {
  return Number.isInteger(maxBuddy) && maxBuddy > 0 ? maxBuddy : DEFAULT_MAX_BUDDY;
}

function normalizeSettings(settings, options = {}) {
  return {
    backup: normalizeBackupData(settings?.backup, options),
    maxBuddy: normalizeMaxBuddy(settings?.maxBuddy),
    pendingBuddy: normalizePendingBuddy(settings?.pendingBuddy)
  };
}

export function saveSettings(settings) {
  const filePath = getSettingsFile();
  const tempFile = `${filePath}.tmp`;
  if (existsSync(tempFile)) {
    throw new Error(`Refusing to write through existing temporary file at ${tempFile}. Remove it and retry.`);
  }
  mkdirSync(getDataDir(), { recursive: true });
  const payload = {
    backup: normalizeBackupData(settings?.backup, { strict: true }),
    maxBuddy: normalizeMaxBuddy(settings?.maxBuddy),
    pendingBuddy: settings?.pendingBuddy == null ? null : toStoredPendingBuddy(settings.pendingBuddy)
  };
  writeFileSync(tempFile, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  renameSync(tempFile, filePath);
  return payload;
}

export function migrateFromBackup(options = {}) {
  const backup = normalizeBackupData(readJsonObject(getLegacyBackupFile(), "backup"), { strict: true });
  const settings = saveSettings({ backup, maxBuddy: DEFAULT_MAX_BUDDY, pendingBuddy: null });
  unlinkSync(getLegacyBackupFile());
  return normalizeSettings(settings, options);
}

export function loadSettings(options = {}) {
  const settingsFile = getSettingsFile();
  const legacyBackupFile = getLegacyBackupFile();
  if (!existsSync(settingsFile)) {
    if (existsSync(legacyBackupFile)) {
      return migrateFromBackup(options);
    }
    return { backup: null, maxBuddy: DEFAULT_MAX_BUDDY, pendingBuddy: null };
  }
  return normalizeSettings(readJsonObject(settingsFile, "settings"), options);
}

export function getBackupData() {
  return loadSettings({ strict: true }).backup;
}

export function setBackupData(backup) {
  const settings = loadSettings({ strict: true });
  return saveSettings({ ...settings, backup: backup == null ? null : normalizeBackupData(backup, { strict: true }) });
}

export function getMaxBuddy() {
  return loadSettings().maxBuddy;
}

export function getPendingBuddy() {
  return loadSettings().pendingBuddy;
}

export function setPendingBuddy(buddy) {
  const settings = loadSettings({ strict: true });
  return saveSettings({ ...settings, pendingBuddy: toStoredPendingBuddy(buddy) });
}

export function clearPendingBuddy() {
  const settings = loadSettings({ strict: true });
  return saveSettings({ ...settings, pendingBuddy: null });
}
