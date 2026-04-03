export const BREED_HATCH_ACTIONS = [
  { id: "equip", label: "Equip", shortcut: "e" },
  { id: "add", label: "Add", shortcut: "a" },
  { id: "delete", label: "Delete", shortcut: "d" }
];

export function createEmptyBreedState() {
  return {
    phase: "idle",
    slots: [],
    slotIndex: 0,
    entries: [],
    options: [],
    selectIndex: 0,
    parentA: null,
    parentAIndex: -1,
    parentB: null,
    parentBIndex: -1,
    offspringTraits: null,
    egg: null,
    hatchedBuddy: null,
    hatchActionIndex: 0,
    collectionFull: false,
    timer: null
  };
}
