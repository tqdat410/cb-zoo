import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { getBackupFile, getClaudeStateFileCandidates, getDataDir, isClaudeStateFileCandidate, resolveClaudeStateFile } from "./config.js";
import {
  getCompanionFromConfig,
  getEditableCompanionFromConfig,
  getUuidFromConfig,
  isUuid,
  readJsonFile,
  resolveClaudeState,
  sanitizeCompanionMetadataUpdate,
  validateWritableConfig
} from "./claude-state.js";

function readValidBackup(filePath, invalidMessage) {
  const backup = readJsonFile(filePath, "No cb-zoo backup found. Run cb-zoo --backup first.");
  if (!isUuid(backup?.uuid)) {
    throw new Error(invalidMessage);
  }
  if (backup.stateFile !== undefined && typeof backup.stateFile !== "string") {
    throw new Error("Backup file contains an invalid stateFile path.");
  }
  return backup;
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

export function getCurrentUuid(options = {}) {
  const { config } = resolveClaudeState(options);
  return getUuidFromConfig(config, options);
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
  const { configFile: stateFile, config } = resolveClaudeState({ requireWritableConfig: true });
  const uuid = getUuidFromConfig(config);
  writeJsonFile(backupFile, { uuid, stateFile, backedUpAt: new Date().toISOString() });
  return { created: true, filePath: backupFile, uuid, stateFile };
}

export function applyUuid(newUuid, options = {}) {
  if (!isUuid(newUuid)) {
    throw new Error("Refusing to write an invalid UUID to Claude Code config.");
  }
  const { configFile, config } = resolveClaudeState({ configFile: options.configFile, requireWritableConfig: true });
  config.oauthAccount.accountUuid = newUuid;
  delete config.companion;
  delete config.companionMuted;
  writeJsonFile(configFile, config);
  return {
    uuid: newUuid,
    warning: `Restart Claude Code to hatch from the new UUID. Re-auth can overwrite the UUID back to the original. Updated ${configFile}`
  };
}

export function restoreUuid() {
  const backup = readValidBackup(getBackupFile(), "Backup file is missing a valid UUID.");
  if (backup.stateFile && !isClaudeStateFileCandidate(backup.stateFile)) {
    throw new Error("Backup file points to an unexpected Claude account state path. Fix or recreate backup.json before restoring.");
  }
  return applyUuid(backup.uuid, backup.stateFile ? { configFile: backup.stateFile } : undefined);
}

export function updateCompanionMetadata(updates, options = {}) {
  const nextUpdates = sanitizeCompanionMetadataUpdate(updates);
  const { configFile, config } = resolveClaudeState({ configFile: options.configFile, requireWritableConfig: true });
  getEditableCompanionFromConfig(config);
  config.companion = { ...config.companion, ...nextUpdates };
  writeJsonFile(configFile, config);
  return {
    configFile,
    companion: {
      ...getCompanionFromConfig(config),
      uuid: getUuidFromConfig(config, { allowLegacyUserId: true })
    }
  };
}

export function resetCompanionProfile(options = {}) {
  const { configFile, config } = resolveClaudeState({ configFile: options.configFile, requireWritableConfig: true });
  getEditableCompanionFromConfig(config);
  const uuid = getUuidFromConfig(config, { allowLegacyUserId: true });
  delete config.companion;
  delete config.companionMuted;
  writeJsonFile(configFile, config);
  return { configFile, uuid };
}
