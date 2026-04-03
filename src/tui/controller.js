import { deleteCollectionEntry, resolveCollectionEntry } from "../collection.js";
import { applyUuid, backupUuid, hasBackup, resetCompanionProfile, restoreUuid, updateCompanionMetadata } from "../uuid-manager.js";
import { getHomeMenuItems } from "./views/home-view.js";
import { applyRollAction, runRollSequence } from "./roll-flow.js";
import { getRollActionIndex, ROLL_ACTIONS } from "./roll-config.js";
import { openEdit, resetCollectionPrompt, syncCollection, syncCurrent } from "./state.js";

function isShortcut(key, value) {
  return key.name === "text" && key.value.toLowerCase() === value;
}

function getRollShortcutIndex(key) {
  if (key.name !== "text") {
    return -1;
  }
  return ROLL_ACTIONS.findIndex((action) => action.shortcut === key.value.toLowerCase());
}

function getSelectedCollectionEntry(state) {
  return state.collectionEntries[state.collectionIndex] || null;
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
    resetCollectionPrompt(state);
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
        const shortcutIndex = getRollShortcutIndex(key);
        if (key.name === "left" || isShortcut(key, "h")) {
          state.roll.actionIndex = (state.roll.actionIndex + ROLL_ACTIONS.length - 1) % ROLL_ACTIONS.length;
        } else if (key.name === "right" || isShortcut(key, "l")) {
          state.roll.actionIndex = (state.roll.actionIndex + 1) % ROLL_ACTIONS.length;
        } else if (key.name === "escape") {
          state.roll.actionIndex = getRollActionIndex("back");
          await applyRollAction(state, writeScreen);
        } else if (shortcutIndex >= 0) {
          state.roll.actionIndex = shortcutIndex;
          await applyRollAction(state, writeScreen);
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
        const selectedEntry = getSelectedCollectionEntry(state);
        if (state.collectionPrompt.mode === "confirm-delete") {
          if (key.name === "escape" || isShortcut(key, "n")) {
            resetCollectionPrompt(state);
            state.statusMessage = "Delete canceled.";
          } else if ((key.name === "enter" || isShortcut(key, "y")) && selectedEntry) {
            try {
              const removedSpecies = selectedEntry.species;
              deleteCollectionEntry(selectedEntry);
              syncCollection(state);
              resetCollectionPrompt(state);
              state.statusMessage = state.collectionEntries.length > 0
                ? `${removedSpecies} removed from collection.`
                : "Collection empty.";
            } catch (error) {
              syncCollection(state);
              resetCollectionPrompt(state);
              state.screen = "collection";
              state.statusMessage = error.message;
            }
          }
        } else if (key.name === "escape") {
          state.screen = "home";
          resetCollectionPrompt(state);
        } else if (key.name === "up" || isShortcut(key, "k")) {
          state.collectionIndex = Math.max(0, state.collectionIndex - 1);
        } else if (key.name === "down" || isShortcut(key, "j")) {
          state.collectionIndex = Math.min(state.collectionEntries.length - 1, state.collectionIndex + 1);
        } else if ((key.name === "enter" || isShortcut(key, "a")) && selectedEntry) {
          try {
            const liveEntry = resolveCollectionEntry(selectedEntry);
            if (!hasBackup()) {
              backupUuid();
            }
            applyUuid(liveEntry.uuid);
            syncCurrent(state);
            state.statusMessage = `Applied ${liveEntry.species}. Restart Claude Code.`;
          } catch (error) {
            resetCollectionPrompt(state);
            state.screen = "collection";
            state.statusMessage = error.message;
          }
        } else if (isShortcut(key, "d") && selectedEntry) {
          state.collectionPrompt = { mode: "confirm-delete" };
          state.statusMessage = `Delete ${selectedEntry.species} from collection?`;
        }
      } else if (state.screen === "edit") {
        if (state.edit.confirmReset) {
          if (key.name === "escape" || isShortcut(key, "n")) {
            state.edit.confirmReset = false;
            state.statusMessage = "Reset canceled.";
          } else if (key.name === "enter" || isShortcut(key, "y")) {
            const result = resetCompanionProfile();
            syncCurrent(state);
            state.edit.confirmReset = false;
            state.screen = "home";
            state.statusMessage = `Companion profile reset in ${result.configFile}. Restart Claude Code to re-hatch from current UUID.`;
          }
        } else if (key.name === "escape") {
          state.screen = "home";
          state.statusMessage = "Edit cancelled.";
        } else if (isShortcut(key, "r")) {
          state.edit.confirmReset = true;
          state.statusMessage = "Reset companion profile and let Claude regenerate it?";
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
      state.busy = false;
      state.screen = "home";
      state.statusMessage = error.message;
      writeScreen(state);
    } finally {
      reading = false;
    }
  };
}
