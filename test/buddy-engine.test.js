import test from "node:test";
import assert from "node:assert/strict";
import { hashString, rollFrom } from "../src/buddy-engine.js";
import { renderSprite } from "../src/sprites.js";

test("hashString matches known FNV-1a output", () => {
  assert.equal(hashString("hello"), 1335831723);
});

test("rollFrom returns the expected buddy for a known UUID", () => {
  assert.deepEqual(rollFrom("123e4567-e89b-12d3-a456-426614174000"), {
    uuid: "123e4567-e89b-12d3-a456-426614174000",
    rarity: "uncommon",
    species: "robot",
    eye: "✦",
    hat: "crown",
    shiny: false,
    stats: {
      DEBUGGING: 47,
      PATIENCE: 54,
      CHAOS: 93,
      WISDOM: 53,
      SNARK: 12
    },
    peak: "CHAOS",
    dump: "SNARK",
    total: 259
  });
});

test("renderSprite injects eyes and hat overlay", () => {
  const sprite = renderSprite("robot", "✦", "crown");
  assert.match(sprite, /\\\^\^\^\//);
  assert.match(sprite, /\[ ✦  ✦ \]/);
});

test("renderSprite keeps the 5-line body when no hat is equipped", () => {
  const lines = renderSprite("robot", "✦", "none").split("\n");
  assert.equal(lines.length, 5);
  assert.equal(lines[0].trim(), "");
});
