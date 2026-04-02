import { backupUuid, restoreUuid, updateCompanionMetadata } from "../uuid-manager.js";
import { getHomeMenuItems } from "./views/home-view.js";
import { applyRollAction, runRollSequence } from "./roll-flow.js";
import { openEdit, syncCollection, syncCurrent } from "./state.js";

function isShortcut(key, value) {
  return key.name === "text" && key.value.toLowerCase() === value;
}

async function handleHomeAction(state, writeScreen) {
  const action = getHomeMenuItems()[state.menuIndex]?.id;
  if (action === "quit") {
    state.shouldExit = true;
    return;
  }
  if (action === "roll") {
    await runRollSequence(state, writeScreen);
    return;
  }
  if (action === "current") {
    syncCurrent(state);
    state.screen = "current";
    state.statusMessage = "Current buddy loaded.";
    return;
  }
  if (action === "collection") {
    syncCollection(state);
    state.screen = "collection";
    state.statusMessage = "Browsing collection.";
    return;
  }
  if (action === "edit") {
    openEdit(state);
    return;
  }
  if (action === "backup") {
    const result = backupUuid();
    state.statusMessage = result.created ? "UUID backup created." : "Backup already exists.";
    return;
  }
  if (action === "restore") {
    const result = restoreUuid();
    state.statusMessage = `Restored UUID ${result.uuid}.`;
  }
}

export function createKeypressHandler(state, writeScreen) {
  let reading = false;

  return async (key) => {
    if (reading || state.busy) {
      return;
    }
    reading = true;
    try {
      if (key.name === "quit") {
        state.shouldExit = true;
        return;
      }
      if (state.screen !== "edit" && isShortcut(key, "q")) {
        state.shouldExit = true;
        return;
      }
      if (state.screen === "home") {
        if (key.name === "up" || isShortcut(key, "k")) {
          state.menuIndex = (state.menuIndex + getHomeMenuItems().length - 1) % getHomeMenuItems().length;
        } else if (key.name === "down" || isShortcut(key, "j")) {
          state.menuIndex = (state.menuIndex + 1) % getHomeMenuItems().length;
        } else if (key.name === "enter") {
          await handleHomeAction(state, writeScreen);
        }
      } else if (state.screen === "roll" && state.roll.phase === "revealed") {
        if (key.name === "left" || isShortcut(key, "h")) {
          state.roll.actionIndex = (state.roll.actionIndex + 2) % 3;
        } else if (key.name === "right" || isShortcut(key, "l")) {
          state.roll.actionIndex = (state.roll.actionIndex + 1) % 3;
        } else if (key.name === "escape") {
          state.screen = "home";
        } else if (key.name === "enter") {
          await applyRollAction(state, writeScreen);
        }
      } else if (state.screen === "current") {
        if (key.name === "escape") {
          state.screen = "home";
        } else if (key.name === "text" && key.value.toLowerCase() === "e") {
          openEdit(state);
        }
      } else if (state.screen === "collection") {
        if (key.name === "escape") {
          state.screen = "home";
        } else if (key.name === "up" || isShortcut(key, "k")) {
          state.collectionIndex = Math.max(0, state.collectionIndex - 1);
        } else if (key.name === "down" || isShortcut(key, "j")) {
          state.collectionIndex = Math.min(state.collectionEntries.length - 1, state.collectionIndex + 1);
        }
      } else if (state.screen === "edit") {
        if (key.name === "escape") {
          state.screen = "home";
          state.statusMessage = "Edit cancelled.";
        } else if (key.name === "tab" || key.name === "up" || key.name === "down") {
          state.edit.activeField = state.edit.activeField === "name" ? "personality" : "name";
        } else if (key.name === "backspace") {
          const field = state.edit.activeField === "name" ? "name" : "personality";
          state.edit[field] = state.edit[field].slice(0, -1);
        } else if (key.name === "text") {
          const field = state.edit.activeField === "name" ? "name" : "personality";
          const limit = field === "name" ? 32 : 120;
          if (state.edit[field].length < limit) {
            state.edit[field] += key.value;
          }
        } else if (key.name === "enter") {
          const result = updateCompanionMetadata({ name: state.edit.name, personality: state.edit.personality });
          state.statusMessage = `Updated companion metadata in ${result.configFile}`;
          syncCurrent(state);
          state.screen = "current";
        }
      }

      if (!state.shouldExit) {
        writeScreen(state);
      }
    } catch (error) {
      state.screen = "home";
      state.statusMessage = error.message;
      writeScreen(state);
    } finally {
      reading = false;
    }
  };
}
