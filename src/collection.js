import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { COLLECTION_FILE, RARITIES, RARITY_ORDER, SPECIES, getCollectionFile, getDataDir } from "./config.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function stripUtf8Bom(content) {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function isCollectionEntry(entry) {
  return (
    entry &&
    typeof entry === "object" &&
    !Array.isArray(entry) &&
    typeof entry.uuid === "string" &&
    UUID_PATTERN.test(entry.uuid) &&
    SPECIES.includes(entry.species) &&
    RARITIES.includes(entry.rarity) &&
    typeof entry.eye === "string" &&
    typeof entry.hat === "string" &&
    typeof entry.shiny === "boolean" &&
    Number.isFinite(entry.total) &&
    (entry.rolledAt === undefined || typeof entry.rolledAt === "string")
  );
}

function readCollectionFile() {
  const filePath = getCollectionFile();
  if (!existsSync(filePath)) {
    return [];
  }
  try {
    const parsed = JSON.parse(stripUtf8Bom(readFileSync(filePath, "utf8")));
    if (!Array.isArray(parsed)) {
      throw new Error("Collection file must contain a JSON array.");
    }
    if (!parsed.every(isCollectionEntry)) {
      throw new Error("Collection file contains invalid buddy entries.");
    }
    return parsed;
  } catch (error) {
    throw new Error(`cb-zoo collection exists but is invalid. Fix or delete collection.json before continuing. ${error.message}`);
  }
}

function writeCollectionFile(entries) {
  mkdirSync(getDataDir(), { recursive: true });
  const filePath = getCollectionFile();
  const tempFile = `${filePath}.tmp`;
  if (existsSync(tempFile)) {
    throw new Error(`Refusing to write through existing temporary file at ${tempFile}. Remove it and retry.`);
  }
  writeFileSync(tempFile, `${JSON.stringify(entries, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  renameSync(tempFile, filePath);
}

export function loadCollection() {
  return readCollectionFile();
}

export function saveToCollection(buddy) {
  const entries = readCollectionFile();
  const entry = {
    uuid: buddy.uuid,
    species: buddy.species,
    rarity: buddy.rarity,
    eye: buddy.eye,
    hat: buddy.hat,
    shiny: buddy.shiny,
    total: buddy.total,
    rolledAt: new Date().toISOString()
  };
  if (!isCollectionEntry(entry)) {
    throw new Error("Refusing to save an invalid collection entry.");
  }
  entries.push(entry);
  writeCollectionFile(entries);
  return entry;
}

export function getStats(collection = readCollectionFile()) {
  const uniqueCombos = new Set(collection.map((entry) => `${entry.species}:${entry.rarity}`));
  const shinies = collection.filter((entry) => entry.shiny).length;
  const legendaries = collection.filter((entry) => entry.rarity === "legendary").length;
  const rarest = [...collection].sort((left, right) => {
    const rarityDelta = (RARITY_ORDER[right.rarity] ?? -1) - (RARITY_ORDER[left.rarity] ?? -1);
    return rarityDelta || (right.total ?? 0) - (left.total ?? 0);
  })[0];
  return { total: collection.length, unique: uniqueCombos.size, shinies, legendaries, rarest };
}

export function formatCollection(collection = readCollectionFile()) {
  const discovered = new Map();
  const shinySpecies = new Set();
  for (const entry of collection) {
    discovered.set(`${entry.species}:${entry.rarity}`, true);
    if (entry.shiny) {
      shinySpecies.add(entry.species);
    }
  }

  const rows = SPECIES.map((species) => {
    const marks = RARITIES.map((rarity) => (discovered.has(`${species}:${rarity}`) ? "✓" : "·"));
    return `${species.padEnd(10)} ${marks.join("   ")}   ${shinySpecies.has(species) ? "✓" : "·"}`;
  });
  const stats = getStats(collection);
  const rarestLabel = stats.rarest ? `${stats.rarest.rarity} ${stats.rarest.species}` : "none";
  return [
    "CB-ZOO COLLECTION",
    "",
    "Species    C   U   R   E   L   Shiny",
    ...rows,
    "",
    `Total Rolls: ${stats.total}`,
    `Unique Combos: ${stats.unique}/${SPECIES.length * RARITIES.length}`,
    `Shiny Rolls: ${stats.shinies}`,
    `Legendary Rolls: ${stats.legendaries}`,
    `Rarest Roll: ${rarestLabel}`
  ].join("\n");
}

export function displayCollection() {
  const output = formatCollection();
  process.stdout.write(`${output}\n`);
  return output;
}

export { COLLECTION_FILE };
