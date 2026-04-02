import { emitKeypressEvents } from "node:readline";

export function normalizeKeypress(str, key = {}) {
  if (key.ctrl && key.name === "c") {
    return { name: "quit" };
  }
  if (key.name === "return") {
    return { name: "enter" };
  }
  if (key.name === "escape") {
    return { name: "escape" };
  }
  if (key.name === "backspace") {
    return { name: "backspace" };
  }
  if (key.name === "tab") {
    return { name: "tab" };
  }
  if (["up", "down", "left", "right"].includes(key.name)) {
    return { name: key.name };
  }
  if (str && str >= " " && str <= "~") {
    return { name: "text", value: str };
  }
  return { name: key.name || "unknown", value: str };
}

export function createKeypressReader(callback) {
  emitKeypressEvents(process.stdin);
  const handler = (str, key) => {
    callback(normalizeKeypress(str, key));
  };
  process.stdin.on("keypress", handler);
  if (process.stdin.isTTY && typeof process.stdin.setRawMode === "function") {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  return () => {
    process.stdin.off("keypress", handler);
    if (process.stdin.isTTY && typeof process.stdin.setRawMode === "function") {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
  };
}
