import { createKeypressReader } from "./read-keypress.js";
import { renderHandheldScreen } from "./render-layout.js";
import { createKeypressHandler } from "./controller.js";
import { createInitialState, renderScreen } from "./state.js";

function writeScreen(state) {
  process.stdout.write(renderHandheldScreen(renderScreen(state)));
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

  enterAlternateScreen();
  writeScreen(state);
  const stopReading = createKeypressReader((key) => {
    void dispatch(key);
  });

  try {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (state.shouldExit) {
          clearInterval(interval);
          resolve();
        }
      }, 25);
    });
  } finally {
    stopReading();
    leaveAlternateScreen();
  }
}
