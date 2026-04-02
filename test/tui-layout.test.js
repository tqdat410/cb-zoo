import test from "node:test";
import assert from "node:assert/strict";
import { renderHandheldScreen } from "../src/tui/render-layout.js";

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
});
