import { renderSprite } from "../../sprites.js";
import { ANSI } from "../render-helpers.js";

export function renderCollectionView(state) {
  const entries = state.collectionEntries;
  if (entries.length === 0) {
    return {
      title: "COLLECTION",
      subtitle: "Pokedex shelf",
      bodyLines: ["No buddies collected yet."],
      footer: "Esc back",
      status: state.statusMessage || "Collection empty."
    };
  }

  const selected = entries[state.collectionIndex];
  const windowSize = 8;
  const windowStart = Math.max(0, Math.min(state.collectionIndex - Math.floor(windowSize / 2), Math.max(0, entries.length - windowSize)));
  const listLines = entries.slice(windowStart, windowStart + windowSize).map((entry, index) => {
    const actualIndex = windowStart + index;
    const selectedIndex = actualIndex === state.collectionIndex;
    const label = `${entry.species.padEnd(10)} ${entry.rarity.padEnd(10)} ${String(entry.total).padStart(3)}`;
    return selectedIndex ? `${ANSI.gold}▶ ${label}${ANSI.reset}` : `  ${label}`;
  });

  const bodyLines = [
    "Party Shelf",
    ...listLines,
    "",
    "Buddy Detail",
    ...renderSprite(selected.species, selected.eye, selected.hat).split("\n"),
    "",
    `Species: ${selected.species}`,
    `Rarity: ${selected.rarity}`,
    `Eyes: ${selected.eye}  Hat: ${selected.hat}`,
    `Shiny: ${selected.shiny ? "yes" : "no"}  Total: ${selected.total}`,
    `Rolled: ${selected.rolledAt || "unknown"}`
  ];

  return {
    title: "COLLECTION",
    subtitle: "Latest pulls on the handheld shelf",
    bodyLines,
    footer: "Up/Down move  Esc back",
    status: state.statusMessage || `${entries.length} buddies stored.`
  };
}
