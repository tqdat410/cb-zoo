import test from "node:test";
import assert from "node:assert/strict";
import { hashString, rollFrom } from "../src/buddy-engine.js";
import { renderSprite } from "../src/sprites.js";

test("hashString matches known wyhash output", () => {
  assert.equal(hashString("hello"), 4181676845);
});

test("rollFrom returns the expected buddy for a known UUID", () => {
  assert.deepEqual(rollFrom("123e4567-e89b-12d3-a456-426614174000"), {
    uuid: "123e4567-e89b-12d3-a456-426614174000",
    rarity: "common",
    species: "turtle",
    eye: "◉",
    hat: "none",
    shiny: false,
    stats: {
      DEBUGGING: 1,
      PATIENCE: 26,
      CHAOS: 19,
      WISDOM: 39,
      SNARK: 70
    },
    peak: "SNARK",
    dump: "DEBUGGING",
    total: 155
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
