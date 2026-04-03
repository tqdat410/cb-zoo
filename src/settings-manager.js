import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { EYES, HATS, RARITIES, SPECIES, getDataDir, getSettingsFile } from "./config.js";
import { isUuid } from "./claude-state.js";

export const DEFAULT_MAX_BUDDY = 50;
export const DEFAULT_MAX_ROLL_CHARGES = 100;
export const DEFAULT_ROLL_REGEN_MS = 300_000;

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

function isBreedEgg(egg) {
  return (
    egg &&
    typeof egg === "object" &&
    !Array.isArray(egg) &&
    isUuid(egg.parentA) &&
    isUuid(egg.parentB) &&
    egg.parentA !== egg.parentB &&
    SPECIES.includes(egg.species) &&
    EYES.includes(egg.eye) &&
    HATS.includes(egg.hat) &&
    RARITIES.includes(egg.rarity) &&
    (egg.rarity !== "common" || egg.hat === "none") &&
    typeof egg.shiny === "boolean" &&
    (egg.hatchedUuid === undefined || isUuid(egg.hatchedUuid)) &&
    Number.isFinite(egg.createdAt) &&
    Number.isFinite(egg.hatchAt)
  );
}

function normalizeBreedEgg(egg) {
  return isBreedEgg(egg) ? egg : null;
}

function toStoredBreedEgg(egg) {
  const breedEgg = {
    parentA: egg?.parentA,
    parentB: egg?.parentB,
    species: egg?.species,
    eye: egg?.eye,
    hat: egg?.hat,
    rarity: egg?.rarity,
    shiny: egg?.shiny,
    ...(egg?.hatchedUuid ? { hatchedUuid: egg.hatchedUuid } : {}),
    createdAt: egg?.createdAt,
    hatchAt: egg?.hatchAt
  };
  if (!isBreedEgg(breedEgg)) {
    throw new Error("Refusing to save invalid breed egg data.");
  }
  return breedEgg;
}

function normalizeMaxBuddy(maxBuddy) {
  return Number.isInteger(maxBuddy) && maxBuddy > 0 ? maxBuddy : DEFAULT_MAX_BUDDY;
}

function normalizeRollConfig(rollConfig, { strictRollState = false } = {}) {
  if (rollConfig == null) {
    return {
      maxCharges: DEFAULT_MAX_ROLL_CHARGES,
      regenMs: DEFAULT_ROLL_REGEN_MS
    };
  }
  if (!rollConfig || typeof rollConfig !== "object" || Array.isArray(rollConfig)) {
    if (strictRollState) {
      throw new Error("Roll config must be a JSON object.");
    }
    return {
      maxCharges: DEFAULT_MAX_ROLL_CHARGES,
      regenMs: DEFAULT_ROLL_REGEN_MS
    };
  }
  if (
    strictRollState &&
    (
      (rollConfig.maxCharges !== undefined && (!Number.isInteger(rollConfig.maxCharges) || rollConfig.maxCharges <= 0)) ||
      (rollConfig.regenMs !== undefined && (!Number.isInteger(rollConfig.regenMs) || rollConfig.regenMs <= 0))
    )
  ) {
    throw new Error("Roll config must use positive integer maxCharges and regenMs values.");
  }
  return {
    maxCharges:
      Number.isInteger(rollConfig?.maxCharges) && rollConfig.maxCharges > 0
        ? rollConfig.maxCharges
        : DEFAULT_MAX_ROLL_CHARGES,
    regenMs:
      Number.isInteger(rollConfig?.regenMs) && rollConfig.regenMs > 0
        ? rollConfig.regenMs
        : DEFAULT_ROLL_REGEN_MS
  };
}

function isRollCharges(rollCharges) {
  return (
    rollCharges &&
    typeof rollCharges === "object" &&
    !Array.isArray(rollCharges) &&
    Number.isInteger(rollCharges.available) &&
    rollCharges.available >= 0 &&
    Number.isFinite(rollCharges.updatedAt)
  );
}

function normalizeRollCharges(rollCharges, rollConfig, now = Date.now()) {
  return normalizeRollChargesWithOptions(rollCharges, rollConfig, now);
}

function normalizeRollChargesWithOptions(rollCharges, rollConfig, now = Date.now(), { strictRollState = false } = {}) {
  if (rollCharges == null) {
    return {
      available: rollConfig.maxCharges,
      updatedAt: now
    };
  }
  if (!isRollCharges(rollCharges)) {
    if (strictRollState) {
      throw new Error("Roll charges must define a non-negative integer available count and numeric updatedAt.");
    }
    return {
      available: rollConfig.maxCharges,
      updatedAt: now
    };
  }
  return {
    available: Math.min(rollConfig.maxCharges, rollCharges.available),
    updatedAt: rollCharges.updatedAt
  };
}

function toStoredRollCharges(rollCharges, rollConfig) {
  const storedRollCharges = normalizeRollChargesWithOptions(rollCharges, rollConfig, Date.now(), { strict: true });
  if (!isRollCharges(storedRollCharges)) {
    throw new Error("Refusing to save invalid roll charge data.");
  }
  return storedRollCharges;
}

function normalizeSettings(settings, options = {}) {
  const rollConfig = normalizeRollConfig(settings?.rollConfig, options);
  return {
    backup: normalizeBackupData(settings?.backup, options),
    maxBuddy: normalizeMaxBuddy(settings?.maxBuddy),
    rollConfig,
    rollCharges: normalizeRollChargesWithOptions(settings?.rollCharges, rollConfig, options.now, options),
    pendingBuddy: normalizePendingBuddy(settings?.pendingBuddy),
    breedEgg: normalizeBreedEgg(settings?.breedEgg)
  };
}

export function saveSettings(settings) {
  const filePath = getSettingsFile();
  const tempFile = `${filePath}.tmp`;
  if (existsSync(tempFile)) {
    throw new Error(`Refusing to write through existing temporary file at ${tempFile}. Remove it and retry.`);
  }
  mkdirSync(getDataDir(), { recursive: true });
  const rollConfig = normalizeRollConfig(settings?.rollConfig);
  const payload = {
    backup: normalizeBackupData(settings?.backup, { strict: true }),
    maxBuddy: normalizeMaxBuddy(settings?.maxBuddy),
    rollConfig,
    rollCharges: toStoredRollCharges(settings?.rollCharges, rollConfig),
    pendingBuddy: settings?.pendingBuddy == null ? null : toStoredPendingBuddy(settings.pendingBuddy),
    breedEgg: settings?.breedEgg == null ? null : toStoredBreedEgg(settings.breedEgg)
  };
  writeFileSync(tempFile, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  renameSync(tempFile, filePath);
  return payload;
}

export function migrateFromBackup(options = {}) {
  const backup = normalizeBackupData(readJsonObject(getLegacyBackupFile(), "backup"), { strict: true });
  const settings = saveSettings({ backup, maxBuddy: DEFAULT_MAX_BUDDY, pendingBuddy: null, breedEgg: null });
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
    return normalizeSettings({ backup: null, maxBuddy: DEFAULT_MAX_BUDDY, pendingBuddy: null, breedEgg: null }, options);
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

export function getBreedEgg() {
  return loadSettings().breedEgg;
}

export function getRollConfig() {
  return loadSettings({ strict: true, strictRollState: true }).rollConfig;
}

export function getRollCharges() {
  return loadSettings({ strict: true, strictRollState: true }).rollCharges;
}

export function setPendingBuddy(buddy) {
  const settings = loadSettings({ strict: true });
  return saveSettings({ ...settings, pendingBuddy: toStoredPendingBuddy(buddy) });
}

export function setBreedEgg(egg) {
  const settings = loadSettings({ strict: true });
  return saveSettings({ ...settings, breedEgg: toStoredBreedEgg(egg) });
}

export function clearPendingBuddy() {
  const settings = loadSettings({ strict: true });
  return saveSettings({ ...settings, pendingBuddy: null });
}

export function clearBreedEgg() {
  const settings = loadSettings({ strict: true });
  return saveSettings({ ...settings, breedEgg: null });
}

export function setRollCharges(rollCharges) {
  const settings = loadSettings({ strict: true });
  return saveSettings({ ...settings, rollCharges: toStoredRollCharges(rollCharges, settings.rollConfig) });
}

export function isEggReady() {
  const egg = getBreedEgg();
  return Boolean(egg && Date.now() >= egg.hatchAt);
}
