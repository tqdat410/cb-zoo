import { existsSync, readFileSync } from "node:fs";
import { getClaudeStateFileCandidates } from "./config.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function stripUtf8Bom(content) {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

export function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function readJsonFile(filePath, missingMessage) {
  if (!existsSync(filePath)) {
    throw new Error(missingMessage);
  }
  try {
    return JSON.parse(stripUtf8Bom(readFileSync(filePath, "utf8")));
  } catch (error) {
    throw new Error(`Failed to parse JSON at ${filePath}: ${error.message}`);
  }
}

export function getUuidFromConfig(config, { allowLegacyUserId = false } = {}) {
  const accountUuid = config?.oauthAccount?.accountUuid;
  if (isUuid(accountUuid)) {
    return accountUuid;
  }
  if (allowLegacyUserId && isUuid(config?.userID)) {
    return config.userID;
  }
  throw new Error("Claude Code config is missing a valid oauthAccount.accountUuid.");
}

export function validateWritableConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Claude Code config must contain a JSON object.");
  }
  if (!config.oauthAccount || typeof config.oauthAccount !== "object" || Array.isArray(config.oauthAccount)) {
    throw new Error("Claude Code config is missing a valid oauthAccount object.");
  }
  if (!isUuid(config.oauthAccount.accountUuid)) {
    throw new Error("Claude Code config is missing a valid oauthAccount.accountUuid.");
  }
}

export function getCompanionFromConfig(config) {
  const companion = config?.companion;
  if (!companion || typeof companion !== "object" || Array.isArray(companion)) {
    return null;
  }
  if (typeof companion.name !== "string" || companion.name.trim() === "") {
    return null;
  }
  return {
    name: companion.name,
    personality: typeof companion.personality === "string" ? companion.personality : "",
    hatchedAt: typeof companion.hatchedAt === "number" ? companion.hatchedAt : null
  };
}

function sanitizeCompanionField(value, fieldName) {
  if (typeof value !== "string") {
    throw new Error(`Companion ${fieldName} must be a string.`);
  }
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    throw new Error(`Companion ${fieldName} cannot be empty.`);
  }
  return trimmedValue;
}

export function sanitizeCompanionMetadataUpdate(updates) {
  const nextUpdates = {};
  if (updates.name !== undefined) {
    nextUpdates.name = sanitizeCompanionField(updates.name, "name");
  }
  if (updates.personality !== undefined) {
    nextUpdates.personality = sanitizeCompanionField(updates.personality, "personality");
  }
  if (Object.keys(nextUpdates).length === 0) {
    throw new Error("Provide --set-name and/or --set-personality.");
  }
  return nextUpdates;
}

export function getEditableCompanionFromConfig(config) {
  const companion = getCompanionFromConfig(config);
  if (!companion) {
    throw new Error("Claude Code config does not contain an editable companion yet.");
  }
  return companion;
}

export function resolveClaudeState(options = {}) {
  const candidatePaths = options.configFile ? [options.configFile] : getClaudeStateFileCandidates();
  let firstValidationError;

  for (const configFile of candidatePaths) {
    if (!existsSync(configFile)) {
      continue;
    }
    try {
      const config = readJsonFile(configFile, "Claude Code account state not found. Run Claude Code once before using cb-zoo.");
      if (options.requireWritableConfig) {
        validateWritableConfig(config);
      } else {
        getUuidFromConfig(config, options);
      }
      return { configFile, config };
    } catch (error) {
      if (options.configFile) {
        throw error;
      }
      firstValidationError ||= error;
    }
  }

  if (firstValidationError) {
    throw firstValidationError;
  }
  throw new Error(`Claude Code account state not found. Run Claude Code once before using cb-zoo. Checked: ${candidatePaths.join(", ")}`);
}
