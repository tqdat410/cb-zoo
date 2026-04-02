import test from "node:test";
import assert from "node:assert/strict";
import { hasDirectCommand, shouldLaunchTui } from "../src/launch-mode.js";

test("hasDirectCommand detects existing plain command flags", () => {
  assert.equal(hasDirectCommand({ quick: true }), true);
  assert.equal(hasDirectCommand({ current: true }), true);
  assert.equal(hasDirectCommand({ "set-name": "Nova" }), true);
  assert.equal(hasDirectCommand({}), false);
});

test("shouldLaunchTui only enables default TUI for interactive no-flag runs", () => {
  assert.equal(shouldLaunchTui({}, { stdinIsTTY: true, stdoutIsTTY: true }), true);
  assert.equal(shouldLaunchTui({ help: true }, { stdinIsTTY: true, stdoutIsTTY: true }), false);
  assert.equal(shouldLaunchTui({ plain: true }, { stdinIsTTY: true, stdoutIsTTY: true }), false);
  assert.equal(shouldLaunchTui({ quick: true }, { stdinIsTTY: true, stdoutIsTTY: true }), false);
  assert.equal(shouldLaunchTui({}, { stdinIsTTY: false, stdoutIsTTY: true }), false);
});
