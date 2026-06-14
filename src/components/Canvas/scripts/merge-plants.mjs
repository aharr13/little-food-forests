// Script to merge new plants data with existing database
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read both files
const newPlants = JSON.parse(readFileSync(join(__dirname, '../wiki-import/plants.json'), 'utf-8'));
const existingPlants = JSON.parse(readFileSync(join(__dirname, '../data/plants-texas.json'), 'utf-8'));

// Create a map of plants by scientific name (lowercase for comparison)
const plantMap = new Map();

// First, add all new plants (they have regions and toxicityWarning)
// But skip ones that say "Already listed in..."
for (const plant of newPlants) {
  if (plant.description && plant.description.includes('Already listed')) {
    console.log(`Skipping duplicate: ${plant.commonName}`);
    continue;
  }
  const key = plant.scientificName.toLowerCase();
  plantMap.set(key, plant);
}

// Now add existing plants that aren't already in the map
for (const plant of existingPlants) {
  const key = plant.scientificName.toLowerCase();
  if (!plantMap.has(key)) {
    console.log(`Adding unique existing plant: ${plant.commonName}`);
    plantMap.set(key, plant);
  }
}

// Convert map back to array
const mergedPlants = Array.from(plantMap.values());

// Sort alphabetically by common name
mergedPlants.sort((a, b) => a.commonName.localeCompare(b.commonName));

console.log(`\nMerge complete:`);
console.log(`  New plants: ${newPlants.length}`);
console.log(`  Existing plants: ${existingPlants.length}`);
console.log(`  Merged (unique): ${mergedPlants.length}`);

// Write merged file
writeFileSync(
  join(__dirname, '../data/plants-texas.json'),
  JSON.stringify(mergedPlants, null, 2),
  'utf-8'
);

console.log(`\nSaved to data/plants-texas.json`);
