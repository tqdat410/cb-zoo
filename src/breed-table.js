import { SPECIES } from "./config.js";

const BREED_PAIRS = [
  ["duck", "goose", "goose"],
  ["duck", "blob", "duck"],
  ["duck", "cat", "cat"],
  ["duck", "dragon", "dragon"],
  ["duck", "octopus", "axolotl"],
  ["duck", "owl", "owl"],
  ["duck", "penguin", "penguin"],
  ["duck", "turtle", "turtle"],
  ["duck", "snail", "snail"],
  ["duck", "ghost", "snail"],
  ["duck", "axolotl", "duck"],
  ["duck", "capybara", "duck"],
  ["duck", "cactus", "owl"],
  ["duck", "robot", "duck"],
  ["duck", "rabbit", "goose"],
  ["duck", "mushroom", "duck"],
  ["duck", "chonk", "duck"],
  ["goose", "blob", "blob"],
  ["goose", "cat", "goose"],
  ["goose", "dragon", "dragon"],
  ["goose", "octopus", "octopus"],
  ["goose", "owl", "owl"],
  ["goose", "penguin", "penguin"],
  ["goose", "turtle", "goose"],
  ["goose", "snail", "snail"],
  ["goose", "ghost", "ghost"],
  ["goose", "axolotl", "axolotl"],
  ["goose", "capybara", "capybara"],
  ["goose", "cactus", "cactus"],
  ["goose", "robot", "goose"],
  ["goose", "rabbit", "rabbit"],
  ["goose", "mushroom", "mushroom"],
  ["goose", "chonk", "chonk"],
  ["blob", "cat", "blob"],
  ["blob", "dragon", "dragon"],
  ["blob", "octopus", "blob"],
  ["blob", "owl", "owl"],
  ["blob", "penguin", "penguin"],
  ["blob", "turtle", "turtle"],
  ["blob", "snail", "snail"],
  ["blob", "ghost", "dragon"],
  ["blob", "axolotl", "penguin"],
  ["blob", "capybara", "goose"],
  ["blob", "cactus", "dragon"],
  ["blob", "robot", "blob"],
  ["blob", "rabbit", "blob"],
  ["blob", "mushroom", "blob"],
  ["blob", "chonk", "blob"],
  ["cat", "dragon", "dragon"],
  ["cat", "octopus", "octopus"],
  ["cat", "owl", "owl"],
  ["cat", "penguin", "cat"],
  ["cat", "turtle", "turtle"],
  ["cat", "snail", "cat"],
  ["cat", "ghost", "ghost"],
  ["cat", "axolotl", "cat"],
  ["cat", "capybara", "cat"],
  ["cat", "cactus", "cactus"],
  ["cat", "robot", "cat"],
  ["cat", "rabbit", "cat"],
  ["cat", "mushroom", "cat"],
  ["cat", "chonk", "cat"],
  ["dragon", "octopus", "dragon"],
  ["dragon", "owl", "dragon"],
  ["dragon", "penguin", "penguin"],
  ["dragon", "turtle", "turtle"],
  ["dragon", "snail", "snail"],
  ["dragon", "ghost", "ghost"],
  ["dragon", "axolotl", "dragon"],
  ["dragon", "capybara", "capybara"],
  ["dragon", "cactus", "cactus"],
  ["dragon", "robot", "robot"],
  ["dragon", "rabbit", "rabbit"],
  ["dragon", "mushroom", "mushroom"],
  ["dragon", "chonk", "chonk"],
  ["octopus", "owl", "owl"],
  ["octopus", "penguin", "penguin"],
  ["octopus", "turtle", "octopus"],
  ["octopus", "snail", "snail"],
  ["octopus", "ghost", "ghost"],
  ["octopus", "axolotl", "axolotl"],
  ["octopus", "capybara", "octopus"],
  ["octopus", "cactus", "cactus"],
  ["octopus", "robot", "octopus"],
  ["octopus", "rabbit", "octopus"],
  ["octopus", "mushroom", "mushroom"],
  ["octopus", "chonk", "octopus"],
  ["owl", "penguin", "penguin"],
  ["owl", "turtle", "turtle"],
  ["owl", "snail", "owl"],
  ["owl", "ghost", "ghost"],
  ["owl", "axolotl", "axolotl"],
  ["owl", "capybara", "capybara"],
  ["owl", "cactus", "cactus"],
  ["owl", "robot", "robot"],
  ["owl", "rabbit", "owl"],
  ["owl", "mushroom", "mushroom"],
  ["owl", "chonk", "chonk"],
  ["penguin", "turtle", "turtle"],
  ["penguin", "snail", "snail"],
  ["penguin", "ghost", "ghost"],
  ["penguin", "axolotl", "axolotl"],
  ["penguin", "capybara", "capybara"],
  ["penguin", "cactus", "duck"],
  ["penguin", "robot", "robot"],
  ["penguin", "rabbit", "rabbit"],
  ["penguin", "mushroom", "penguin"],
  ["penguin", "chonk", "chonk"],
  ["turtle", "snail", "snail"],
  ["turtle", "ghost", "ghost"],
  ["turtle", "axolotl", "axolotl"],
  ["turtle", "capybara", "capybara"],
  ["turtle", "cactus", "cactus"],
  ["turtle", "robot", "robot"],
  ["turtle", "rabbit", "rabbit"],
  ["turtle", "mushroom", "turtle"],
  ["turtle", "chonk", "turtle"],
  ["snail", "ghost", "ghost"],
  ["snail", "axolotl", "axolotl"],
  ["snail", "capybara", "capybara"],
  ["snail", "cactus", "cactus"],
  ["snail", "robot", "robot"],
  ["snail", "rabbit", "goose"],
  ["snail", "mushroom", "mushroom"],
  ["snail", "chonk", "blob"],
  ["ghost", "axolotl", "axolotl"],
  ["ghost", "capybara", "capybara"],
  ["ghost", "cactus", "cactus"],
  ["ghost", "robot", "robot"],
  ["ghost", "rabbit", "rabbit"],
  ["ghost", "mushroom", "mushroom"],
  ["ghost", "chonk", "blob"],
  ["axolotl", "capybara", "capybara"],
  ["axolotl", "cactus", "duck"],
  ["axolotl", "robot", "robot"],
  ["axolotl", "rabbit", "rabbit"],
  ["axolotl", "mushroom", "mushroom"],
  ["axolotl", "chonk", "goose"],
  ["capybara", "cactus", "goose"],
  ["capybara", "robot", "robot"],
  ["capybara", "rabbit", "rabbit"],
  ["capybara", "mushroom", "duck"],
  ["capybara", "chonk", "chonk"],
  ["cactus", "robot", "robot"],
  ["cactus", "rabbit", "rabbit"],
  ["cactus", "mushroom", "mushroom"],
  ["cactus", "chonk", "chonk"],
  ["robot", "rabbit", "rabbit"],
  ["robot", "mushroom", "octopus"],
  ["robot", "chonk", "chonk"],
  ["rabbit", "mushroom", "mushroom"],
  ["rabbit", "chonk", "chonk"],
  ["mushroom", "chonk", "chonk"]
];

export const BREED_TABLE = new Map();

for (const [parentA, parentB, offspring] of BREED_PAIRS) {
  const forward = BREED_TABLE.get(parentA) || new Map();
  const backward = BREED_TABLE.get(parentB) || new Map();
  if (forward.has(parentB) && forward.get(parentB) !== offspring) {
    throw new Error(`Breed table conflict for ${parentA} x ${parentB}.`);
  }
  if (backward.has(parentA) && backward.get(parentA) !== offspring) {
    throw new Error(`Breed table conflict for ${parentB} x ${parentA}.`);
  }
  forward.set(parentB, offspring);
  backward.set(parentA, offspring);
  BREED_TABLE.set(parentA, forward);
  BREED_TABLE.set(parentB, backward);
}

function assertKnownSpecies(species) {
  if (!SPECIES.includes(species)) {
    throw new Error(`Unknown species "${species}".`);
  }
}

export function lookupOffspring(parentA, parentB) {
  assertKnownSpecies(parentA);
  assertKnownSpecies(parentB);
  if (parentA === parentB) {
    return parentA;
  }
  const table = BREED_TABLE.get(parentA);
  if (!table || !table.has(parentB)) {
    throw new Error(`Missing breed table entry for ${parentA} x ${parentB}.`);
  }
  return table.get(parentB);
}
