import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { getBackupFile, getConfigFile, getDataDir } from "./config.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function stripUtf8Bom(content) {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function readValidBackup(filePath, invalidMessage) {
  const backup = readJsonFile(filePath, "No cb-zoo backup found. Run cb-zoo --backup first.");
  if (!isUuid(backup?.uuid)) {
    throw new Error(invalidMessage);
  }
  return backup;
}

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function readJsonFile(filePath, missingMessage) {
  if (!existsSync(filePath)) {
    throw new Error(missingMessage);
  }
  try {
    return JSON.parse(stripUtf8Bom(readFileSync(filePath, "utf8")));
  } catch (error) {
    throw new Error(`Failed to parse JSON at ${filePath}: ${error.message}`);
  }
}

function writeJsonFile(filePath, payload) {
  const tempFile = `${filePath}.tmp`;
  if (existsSync(tempFile)) {
    throw new Error(`Refusing to write through existing temporary file at ${tempFile}. Remove it and retry.`);
  }
  writeFileSync(tempFile, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  renameSync(tempFile, filePath);
}

export function ensureDataDir() {
  mkdirSync(getDataDir(), { recursive: true });
  return getDataDir();
}

export function hasBackup() {
  const backupFile = getBackupFile();
  if (!existsSync(backupFile)) {
    return false;
  }
  try {
    readValidBackup(backupFile, "Backup file is missing a valid UUID.");
  } catch (error) {
    throw new Error(`cb-zoo backup exists but is invalid. Fix or delete backup.json before rolling again. ${error.message}`);
  }
  return true;
}

export function getCurrentUuid() {
  const config = readJsonFile(
    getConfigFile(),
    "Claude Code config not found. Run Claude Code once before using cb-zoo."
  );
  const uuid = config?.oauthAccount?.accountUuid;
  if (!isUuid(uuid)) {
    throw new Error("Claude Code config is missing a valid oauthAccount.accountUuid.");
  }
  return uuid;
}

export function backupUuid() {
  ensureDataDir();
  const backupFile = getBackupFile();
  if (existsSync(backupFile)) {
    try {
      return { created: false, filePath: backupFile, uuid: readValidBackup(backupFile, "Backup file is missing a valid UUID.").uuid };
    } catch (error) {
      throw new Error(`cb-zoo backup exists but is invalid. Fix or delete backup.json before continuing. ${error.message}`);
    }
  }
  const uuid = getCurrentUuid();
  writeJsonFile(backupFile, { uuid, backedUpAt: new Date().toISOString() });
  return { created: true, filePath: backupFile, uuid };
}

export function applyUuid(newUuid) {
  if (!isUuid(newUuid)) {
    throw new Error("Refusing to write an invalid UUID to Claude Code config.");
  }
  const configFile = getConfigFile();
  const config = readJsonFile(
    configFile,
    "Claude Code config not found. Run Claude Code once before using cb-zoo."
  );
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Claude Code config must contain a JSON object.");
  }
  if (!config.oauthAccount || typeof config.oauthAccount !== "object" || Array.isArray(config.oauthAccount)) {
    throw new Error("Claude Code config is missing a valid oauthAccount object.");
  }
  if (!isUuid(config.oauthAccount.accountUuid)) {
    throw new Error("Claude Code config is missing a valid oauthAccount.accountUuid.");
  }
  config.oauthAccount.accountUuid = newUuid;
  writeJsonFile(configFile, config);
  return {
    uuid: newUuid,
    warning: "Restart Claude Code to see your new buddy. Re-auth can overwrite the UUID back to the original."
  };
}

export function restoreUuid() {
  const backup = readValidBackup(getBackupFile(), "Backup file is missing a valid UUID.");
  return applyUuid(backup.uuid);
}
