export const ROLL_ACTIONS = [
  { id: "equip", label: "Equip", shortcut: "e" },
  { id: "add", label: "Add", shortcut: "a" },
  { id: "reroll", label: "Reroll", shortcut: "r" },
  { id: "back", label: "Back", shortcut: "b" }
];

export function createIdleRollState() {
  return {
    phase: "idle",
    buddy: null,
    actionIndex: 0,
    previewSpecies: "cat",
    previewEye: "·",
    previewRarity: "common",
    previewColor: "",
    previewBurst: "",
    previewStars: "",
    savedToCollection: false,
    collectionFull: false
  };
}

export function getRollActionIndex(actionId) {
  return Math.max(
    0,
    ROLL_ACTIONS.findIndex((action) => action.id === actionId)
  );
}
