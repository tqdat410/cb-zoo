import { createKeypressReader } from "./read-keypress.js";
import { renderHandheldScreen } from "./render-layout.js";
import { createKeypressHandler } from "./controller.js";
import { createInitialState, renderScreen } from "./state.js";

function getTerminalSnapshot() {
  return {
    columns: process.stdout.columns ?? 80,
    rows: process.stdout.rows ?? 24
  };
}

function writeScreen(state) {
  const terminal = getTerminalSnapshot();
  process.stdout.write(renderHandheldScreen(renderScreen(state, terminal), terminal));
}

function enterAlternateScreen() {
  process.stdout.write("\x1b[?1049h\x1b[?25l");
}

function leaveAlternateScreen() {
  process.stdout.write("\x1b[?25h\x1b[?1049l");
}

export async function launchTuiApp() {
  const state = createInitialState();
  const dispatch = createKeypressHandler(state, writeScreen);
  let stopReading = () => {};
  let refreshInterval = null;
  let exitInterval = null;

  enterAlternateScreen();
  try {
    writeScreen(state);
    stopReading = createKeypressReader((key) => {
      void dispatch(key);
    });
    await new Promise((resolve) => {
      refreshInterval = setInterval(() => {
        if (!state.shouldExit) {
          writeScreen(state);
        }
      }, 1000);
      exitInterval = setInterval(() => {
        if (state.shouldExit) {
          clearInterval(refreshInterval);
          clearInterval(exitInterval);
          resolve();
        }
      }, 25);
    });
  } finally {
    stopReading();
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    if (exitInterval) {
      clearInterval(exitInterval);
    }
    leaveAlternateScreen();
  }
}
