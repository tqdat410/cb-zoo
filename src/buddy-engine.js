import { EYES, HATS, RARITIES, RARITY_FLOOR, RARITY_WEIGHTS, SALT, SPECIES, STAT_NAMES } from "./config.js";

export function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

export function rollRarity(rng) {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  let remaining = rng() * totalWeight;
  for (const rarity of RARITIES) {
    remaining -= RARITY_WEIGHTS[rarity];
    if (remaining < 0) {
      return rarity;
    }
  }
  return "common";
}

export function rollStats(rng, rarity) {
  const floor = RARITY_FLOOR[rarity];
  const peak = pick(rng, STAT_NAMES);
  let dump = pick(rng, STAT_NAMES);
  while (dump === peak) {
    dump = pick(rng, STAT_NAMES);
  }

  const stats = {};
  for (const name of STAT_NAMES) {
    if (name === peak) {
      stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30));
      continue;
    }
    if (name === dump) {
      stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15));
      continue;
    }
    stats[name] = floor + Math.floor(rng() * 40);
  }

  return { stats, peak, dump };
}

export function rollFrom(uuid) {
  const rng = mulberry32(hashString(`${uuid}${SALT}`));
  const rarity = rollRarity(rng);
  const species = pick(rng, SPECIES);
  const eye = pick(rng, EYES);
  const hat = rarity === "common" ? "none" : pick(rng, HATS);
  const shiny = rng() < 0.01;
  const { stats, peak, dump } = rollStats(rng, rarity);
  const total = Object.values(stats).reduce((sum, value) => sum + value, 0);
  return { uuid, rarity, species, eye, hat, shiny, stats, peak, dump, total };
}
