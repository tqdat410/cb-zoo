import test from "node:test";
import assert from "node:assert/strict";
import { formatCompanionSummary } from "../src/companion-state.js";

const COMPANION = {
  name: "Plinth",
  uuid: "73e7fce7-9a2a-40b1-b78e-11571f33011a",
  species: "cat",
  personality: "A methodical tabby that paces when you introduce a bug.",
  hatchedAt: 1775023802769
};

test("formatCompanionSummary renders deterministic UUID-regenerated bones and companion metadata", () => {
  const first = formatCompanionSummary(COMPANION);
  const second = formatCompanionSummary(COMPANION);

  assert.equal(first, second);
  assert.match(first, /Plinth/);
  assert.match(first, /CAT/);
  assert.match(first, /★★★ RARE/);
  assert.match(first, /DEBUGGING/);
  assert.match(first, /PATIENCE/);
  assert.match(first, /CHAOS/);
  assert.match(first, /WISDOM/);
  assert.match(first, /SNARK/);
  assert.match(first, /Bones regenerated from current UUID/);
  assert.match(first, /DEBUGGING  ██████░░░░  61/);
  assert.match(first, /PATIENCE   ████████░░  88/);
  assert.match(first, /Peak:/);
  assert.match(first, /Total:/);
});

test("formatCompanionSummary falls back to cat rendering when species is missing", () => {
  const summary = formatCompanionSummary({
    name: "Plinth",
    uuid: "73e7fce7-9a2a-40b1-b78e-11571f33011a",
    personality: "A methodical tabby that paces when you introduce a bug.",
    hatchedAt: 1775023802769
  });

  assert.match(summary, /CAT/);
  assert.match(summary, /Eyes:/);
});
