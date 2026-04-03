import crypto from "node:crypto";
import { RARITIES, RARITY_ORDER } from "./config.js";
import { rollFrom } from "./buddy-engine.js";
import { lookupOffspring } from "./breed-table.js";

export function calculateOffspringTraits(parentA, parentB) {
  const species = lookupOffspring(parentA.species, parentB.species);
  const eye = Math.random() < 0.5 ? parentA.eye : parentB.eye;
  let hat = Math.random() < 0.5 ? parentA.hat : parentB.hat;
  const tierA = RARITY_ORDER[parentA.rarity];
  const tierB = RARITY_ORDER[parentB.rarity];
  if (tierA === undefined || tierB === undefined) {
    throw new Error("Unknown parent rarity.");
  }
  let avgTier = Math.floor((tierA + tierB) / 2);
  if (Math.random() < 0.15) {
    avgTier = Math.min(RARITIES.length - 1, avgTier + 1);
  }
  const rarity = RARITIES[avgTier];
  if (rarity === "common") {
    hat = "none";
  }
  const shiny = Math.random() < 0.01;
  return { species, eye, hat, rarity, shiny };
}

export function huntUuid(targetTraits, options = {}) {
  const timeout = options.timeout ?? 15000;
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const uuid = crypto.randomUUID();
    const buddy = rollFrom(uuid);
    if (buddy.rarity !== targetTraits.rarity) {
      continue;
    }
    if (buddy.species !== targetTraits.species) {
      continue;
    }
    if (buddy.eye !== targetTraits.eye) {
      continue;
    }
    if (buddy.hat !== targetTraits.hat) {
      continue;
    }
    if (typeof targetTraits.shiny === "boolean" && buddy.shiny !== targetTraits.shiny) {
      continue;
    }
    return buddy;
  }
  throw new Error("UUID hunt timed out");
}
