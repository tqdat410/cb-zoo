import { existsSync, renameSync, writeFileSync } from "node:fs";
import { getSettingsFile, isClaudeStateFileCandidate } from "./config.js";
import {
  getCompanionFromConfig,
  getEditableCompanionFromConfig,
  getUuidFromConfig,
  isUuid,
  resolveClaudeState,
  sanitizeCompanionMetadataUpdate
} from "./claude-state.js";
import { getBackupData, setBackupData } from "./settings-manager.js";


function writeJsonFile(filePath, payload) {
  const tempFile = `${filePath}.tmp`;
  if (existsSync(tempFile)) {
    throw new Error(`Refusing to write through existing temporary file at ${tempFile}. Remove it and retry.`);
  }
  writeFileSync(tempFile, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  renameSync(tempFile, filePath);
}

export function hasBackup() {
  try {
    return getBackupData() !== null;
  } catch (error) {
    throw new Error(`cb-zoo backup exists but is invalid. Fix settings.json before rolling again. ${error.message}`);
  }
}

export function getCurrentUuid(options = {}) {
  const { config } = resolveClaudeState(options);
  return getUuidFromConfig(config, options);
}

export function backupUuid() {
  try {
    const existing = getBackupData();
    if (existing) {
      return { created: false, filePath: getSettingsFile(), uuid: existing.uuid };
    }
  } catch (error) {
    throw new Error(`cb-zoo backup exists but is invalid. Fix settings.json before continuing. ${error.message}`);
  }
  const { configFile: stateFile, config } = resolveClaudeState({ requireWritableConfig: true });
  const uuid = getUuidFromConfig(config);
  setBackupData({ uuid, stateFile, backedUpAt: new Date().toISOString() });
  return { created: true, filePath: getSettingsFile(), uuid, stateFile };
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
  let backup;
  try {
    backup = getBackupData();
  } catch (error) {
    throw new Error(`cb-zoo backup exists but is invalid. Fix settings.json before restoring. ${error.message}`);
  }
  if (!backup) {
    throw new Error("No valid backup found. Run cb-zoo --backup first.");
  }
  if (backup.stateFile && !isClaudeStateFileCandidate(backup.stateFile)) {
    throw new Error("Backup file points to an unexpected Claude account state path. Fix or recreate settings.json before restoring.");
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
