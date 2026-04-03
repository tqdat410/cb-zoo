import {
  loadSettings,
  saveSettings
} from "./settings-manager.js";

function formatClockPart(value) {
  return String(value).padStart(2, "0");
}

export function formatRollCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${formatClockPart(minutes)}:${formatClockPart(seconds)}`
    : `${formatClockPart(minutes)}:${formatClockPart(seconds)}`;
}

export function formatRollChargeSummary(snapshot) {
  const countdown = snapshot.isFull ? "FULL" : formatRollCountdown(snapshot.msUntilNext);
  return `Rerolls ${snapshot.available}/${snapshot.maxCharges}  Gen ${countdown}`;
}

function createSnapshot(settings, now) {
  const { rollConfig, rollCharges } = settings;
  let available = Math.max(0, Math.min(rollConfig.maxCharges, rollCharges.available));
  let updatedAt = rollCharges.updatedAt;

  if (available >= rollConfig.maxCharges) {
    return {
      available: rollConfig.maxCharges,
      maxCharges: rollConfig.maxCharges,
      regenMs: rollConfig.regenMs,
      updatedAt: now,
      nextRefillAt: null,
      msUntilNext: 0,
      isFull: true
    };
  }

  const elapsed = Math.max(0, now - updatedAt);
  const gained = Math.floor(elapsed / rollConfig.regenMs);
  if (gained > 0) {
    available = Math.min(rollConfig.maxCharges, available + gained);
    updatedAt += gained * rollConfig.regenMs;
  }

  if (available >= rollConfig.maxCharges) {
    return {
      available: rollConfig.maxCharges,
      maxCharges: rollConfig.maxCharges,
      regenMs: rollConfig.regenMs,
      updatedAt: now,
      nextRefillAt: null,
      msUntilNext: 0,
      isFull: true
    };
  }

  const msUntilNext = Math.max(1, rollConfig.regenMs - Math.max(0, now - updatedAt));
  return {
    available,
    maxCharges: rollConfig.maxCharges,
    regenMs: rollConfig.regenMs,
    updatedAt,
    nextRefillAt: now + msUntilNext,
    msUntilNext,
    isFull: false
  };
}

function createNoChargesError(snapshot) {
  return new Error(`No rolls left. Next +1 in ${formatRollCountdown(snapshot.msUntilNext)}.`);
}

export function getRollChargeSnapshot(options = {}) {
  const now = options.now ?? Date.now();
  const settings = options.settings ?? loadSettings({ strict: true, strictRollState: true, now });
  return createSnapshot(settings, now);
}

export function consumeRollCharge(options = {}) {
  const now = options.now ?? Date.now();
  const settings = loadSettings({ strict: true, strictRollState: true, now });
  const snapshot = createSnapshot(settings, now);
  if (snapshot.available <= 0) {
    throw createNoChargesError(snapshot);
  }

  const nextRollCharges = {
    available: snapshot.available - 1,
    updatedAt: snapshot.isFull ? now : snapshot.updatedAt
  };
  saveSettings({ ...settings, rollCharges: nextRollCharges });
  return createSnapshot({ ...settings, rollCharges: nextRollCharges }, now);
}
