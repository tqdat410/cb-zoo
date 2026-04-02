import test from "node:test";
import assert from "node:assert/strict";
import { renderHandheldScreen } from "../src/tui/render-layout.js";
import { ANSI } from "../src/tui/render-helpers.js";

test("renderHandheldScreen includes shell chrome and clips overflow body lines", () => {
  const screen = renderHandheldScreen(
    {
      title: "HOME",
      subtitle: "Pokemon handheld launcher",
      bodyLines: Array.from({ length: 40 }, (_, index) => `Line ${index + 1}`),
      footer: "Footer",
      status: "Ready."
    },
    { columns: 72, rows: 18 }
  );

  assert.match(screen, /CB-ZOO \/\/ HANDHELD/);
  assert.match(screen, /HOME/);
  assert.match(screen, /Footer/);
  assert.match(screen, /Ready\./);
  assert.match(screen, /\.\.\./);
  assert.equal(screen.includes(ANSI.bgBlue), false);
});

test("renderHandheldScreen falls back to default footer and status fields", () => {
  const screen = renderHandheldScreen(
    {
      title: "ROLL",
      bodyLines: ["One line"]
    },
    { columns: 64, rows: 24 }
  );

  assert.match(screen, /Arrows move  Enter confirm  Esc back  Q quit/);
});
