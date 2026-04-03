import test from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { consumeRollCharge, formatRollCountdown, getRollChargeSnapshot } from "../src/roll-charge-manager.js";
import { saveSettings } from "../src/settings-manager.js";
import { withTempEnvironment } from "../test-support/with-temp-environment.js";

test("formatRollCountdown renders mm:ss and h:mm:ss", () => {
  assert.equal(formatRollCountdown(300_000), "05:00");
  assert.equal(formatRollCountdown(3_723_000), "1:02:03");
});

test("consumeRollCharge spends one charge from a full stock", async () => {
  await withTempEnvironment(async () => {
    saveSettings({ backup: null, maxBuddy: 50, pendingBuddy: null, breedEgg: null });

    const before = getRollChargeSnapshot({ now: 1_000 });
    assert.equal(before.available, 100);
    assert.equal(before.isFull, true);

    const after = consumeRollCharge({ now: 1_000 });
    assert.equal(after.available, 99);
    assert.equal(after.isFull, false);
    assert.equal(after.msUntilNext, 300_000);
  });
});

test("getRollChargeSnapshot regenerates elapsed charges lazily", async () => {
  await withTempEnvironment(async () => {
    saveSettings({
      backup: null,
      maxBuddy: 50,
      rollConfig: { maxCharges: 5, regenMs: 60_000 },
      rollCharges: { available: 2, updatedAt: 100_000 },
      pendingBuddy: null,
      breedEgg: null
    });

    const snapshot = getRollChargeSnapshot({ now: 281_000 });
    assert.equal(snapshot.available, 5);
    assert.equal(snapshot.isFull, true);
    assert.equal(snapshot.msUntilNext, 0);
  });
});

test("getRollChargeSnapshot keeps partial refill countdown when not full", async () => {
  await withTempEnvironment(async () => {
    saveSettings({
      backup: null,
      maxBuddy: 50,
      rollConfig: { maxCharges: 5, regenMs: 60_000 },
      rollCharges: { available: 1, updatedAt: 100_000 },
      pendingBuddy: null,
      breedEgg: null
    });

    const snapshot = getRollChargeSnapshot({ now: 149_000 });
    assert.equal(snapshot.available, 1);
    assert.equal(snapshot.msUntilNext, 11_000);
    assert.equal(snapshot.nextRefillAt, 160_000);
  });
});

test("consumeRollCharge rejects zero charges with countdown message", async () => {
  await withTempEnvironment(async () => {
    saveSettings({
      backup: null,
      maxBuddy: 50,
      rollConfig: { maxCharges: 5, regenMs: 60_000 },
      rollCharges: { available: 0, updatedAt: 100_000 },
      pendingBuddy: null,
      breedEgg: null
    });

    assert.throws(() => consumeRollCharge({ now: 149_000 }), /Next \+1 in 00:11/);
  });
});

test("getRollChargeSnapshot clamps stored charges to a reduced max", async () => {
  await withTempEnvironment(async () => {
    saveSettings({
      backup: null,
      maxBuddy: 50,
      rollConfig: { maxCharges: 3, regenMs: 60_000 },
      rollCharges: { available: 7, updatedAt: 100_000 },
      pendingBuddy: null,
      breedEgg: null
    });

    const snapshot = getRollChargeSnapshot({ now: 100_000 });
    assert.equal(snapshot.available, 3);
    assert.equal(snapshot.isFull, true);
  });
});

test("getRollChargeSnapshot fails closed on invalid persisted roll config", async () => {
  await withTempEnvironment(async ({ dataDir }) => {
    writeFileSync(
      join(dataDir, "settings.json"),
      JSON.stringify(
        {
          backup: null,
          maxBuddy: 50,
          rollConfig: { maxCharges: -1, regenMs: 0 },
          rollCharges: { available: 3, updatedAt: 100_000 },
          pendingBuddy: null,
          breedEgg: null
        },
        null,
        2
      ),
      "utf8"
    );

    assert.throws(() => getRollChargeSnapshot({ now: 100_000 }), /Roll config/i);
  });
});
