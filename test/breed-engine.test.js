import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { SPECIES } from "../src/config.js";
import { rollFrom } from "../src/buddy-engine.js";
import { lookupOffspring } from "../src/breed-table.js";
import { calculateOffspringTraits, huntUuid } from "../src/breed-engine.js";

function withMockedRandom(values, run) {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => values[Math.min(index++, values.length - 1)];
  try {
    return run();
  } finally {
    Math.random = originalRandom;
  }
}

function getOffspringCounts() {
  const counts = Object.fromEntries(SPECIES.map((species) => [species, 0]));
  for (let i = 0; i < SPECIES.length; i += 1) {
    for (let j = i + 1; j < SPECIES.length; j += 1) {
      const offspring = lookupOffspring(SPECIES[i], SPECIES[j]);
      counts[offspring] += 1;
    }
  }
  return counts;
}

test("breed table is symmetric and complete", () => {
  for (let i = 0; i < SPECIES.length; i += 1) {
    const parentA = SPECIES[i];
    assert.equal(lookupOffspring(parentA, parentA), parentA);
    for (let j = i + 1; j < SPECIES.length; j += 1) {
      const parentB = SPECIES[j];
      const forward = lookupOffspring(parentA, parentB);
      const backward = lookupOffspring(parentB, parentA);
      assert.equal(forward, backward);
    }
  }
});

test("breed table stays balanced across offspring species", () => {
  const counts = getOffspringCounts();
  const values = Object.values(counts);
  assert.equal(values.length, SPECIES.length);
  assert.equal(Math.min(...values), 8);
  assert.equal(Math.max(...values), 9);
});

test("calculateOffspringTraits respects averaging and common hat rule", () => {
  const parentA = { species: "duck", eye: "·", hat: "crown", rarity: "common" };
  const parentB = { species: "goose", eye: "✦", hat: "wizard", rarity: "common" };
  const traits = withMockedRandom([0.6, 0.6, 0.9, 0.5], () =>
    calculateOffspringTraits(parentA, parentB)
  );
  assert.equal(traits.species, lookupOffspring("duck", "goose"));
  assert.equal(traits.eye, "✦");
  assert.equal(traits.rarity, "common");
  assert.equal(traits.hat, "none");
  assert.equal(traits.shiny, false);
});

test("calculateOffspringTraits can upgrade rarity tier", () => {
  const parentA = { species: "dragon", eye: "×", hat: "halo", rarity: "rare" };
  const parentB = { species: "octopus", eye: "◉", hat: "beanie", rarity: "epic" };
  const traits = withMockedRandom([0.1, 0.1, 0.1, 0.5], () =>
    calculateOffspringTraits(parentA, parentB)
  );
  assert.equal(traits.species, lookupOffspring("dragon", "octopus"));
  assert.equal(traits.eye, "×");
  assert.equal(traits.hat, "halo");
  assert.equal(traits.rarity, "epic");
});

test("huntUuid returns a buddy matching the target traits", () => {
  const originalRandomUuid = crypto.randomUUID;
  const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
  crypto.randomUUID = () => targetUuid;
  try {
    const targetBuddy = rollFrom(targetUuid);
    const buddy = huntUuid({
      species: targetBuddy.species,
      eye: targetBuddy.eye,
      hat: targetBuddy.hat,
      rarity: targetBuddy.rarity,
      shiny: false
    });
    assert.equal(buddy.uuid, targetUuid);
    assert.equal(buddy.species, targetBuddy.species);
    assert.equal(buddy.eye, targetBuddy.eye);
    assert.equal(buddy.hat, targetBuddy.hat);
    assert.equal(buddy.rarity, targetBuddy.rarity);
  } finally {
    crypto.randomUUID = originalRandomUuid;
  }
});

test("huntUuid times out when no matching buddy is found", () => {
  const originalRandomUuid = crypto.randomUUID;
  crypto.randomUUID = () => "11111111-1111-4111-8111-111111111111";
  try {
    assert.throws(
      () => huntUuid({ species: "dragon", eye: "@", hat: "wizard", rarity: "legendary", shiny: true }, { timeout: 0 }),
      /timed out/i
    );
  } finally {
    crypto.randomUUID = originalRandomUuid;
  }
});

test("huntUuid honors explicit non-shiny targets", () => {
  const originalRandomUuid = crypto.randomUUID;
  const uuids = [
    "e4100c2f-38e4-479b-9491-5921693d0799",
    "e8061faa-0d10-41de-939e-4491b930c457"
  ];
  let index = 0;
  crypto.randomUUID = () => uuids[index++];
  try {
    const buddy = huntUuid({ species: "robot", eye: "✦", hat: "none", rarity: "common", shiny: false });
    assert.equal(buddy.uuid, "e8061faa-0d10-41de-939e-4491b930c457");
    assert.equal(buddy.shiny, false);
  } finally {
    crypto.randomUUID = originalRandomUuid;
  }
});
