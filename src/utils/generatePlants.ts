// src/utils/generatePlants.ts
// Admin tool: ask the advisor to generate a batch of real, region-appropriate
// food-forest plants (with full tags) and add them to the database. Region is a
// free-text string today (e.g. "Central Texas, USDA zone 8b"); later this can be
// derived automatically from the user's project location.
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { addNewPlantsToDb, CandidatePlant } from './plantDbExpand';

const claudeProxy = httpsCallable<
  { model: string; max_tokens: number; system?: string; messages: { role: 'user' | 'assistant'; content: string }[] },
  { text: string }
>(functions, 'claudeProxy', { timeout: 300000 }); // 5 min — generation can be slow

const VALID_LAYERS = ['canopy', 'understory', 'shrub', 'herbaceous', 'groundcover', 'rhizosphere', 'vine'];

export async function generatePlantsForRegion(region: string, count = 25): Promise<number> {
  const sys = `You are a permaculture plant-database expert. Generate ${count} real, region-appropriate food-forest plants for this region: ${region}.

Requirements:
- Spread them across ALL layers: canopy, understory, shrub, herbaceous, groundcover, rhizosphere, vine.
- Prefer native and climate-adapted species; favor edible/useful and appropriately drought- or moisture-suited plants for the region.
- Use real species with correct scientific names. Do not invent plants.

Return ONLY a JSON array — no prose, no markdown fences. Each element:
{"commonName": string, "scientificName": string, "layer": one of ${JSON.stringify(VALID_LAYERS)}, "guildFunctions": array of any of ["nitrogen-fixer","dynamic-accumulator","insectary","mulch-producer","pest-confuser"], "sunRequirement": one of ["full-sun","partial-shade","full-shade"], "waterRequirement": one of ["low","moderate","high"], "matureHeight": number (feet), "matureSpread": number (feet), "edible": boolean, "nativeToTexas": boolean (true if native to the named region), "description": one short sentence}`;

  const res = await claudeProxy({
    model: 'claude-opus-4-8',
    max_tokens: 8192,
    system: sys,
    messages: [{ role: 'user', content: `Generate ${count} food-forest plants for: ${region}.` }],
  });

  let t = res.data.text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const s = t.indexOf('[');
  const e = t.lastIndexOf(']');
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  let arr: unknown;
  try {
    arr = JSON.parse(t);
  } catch {
    throw new Error('The advisor returned an unreadable list. Please try again.');
  }

  const rows = (Array.isArray(arr) ? arr : []) as Array<Record<string, unknown>>;
  const candidates: CandidatePlant[] = rows
    .filter(p => p && p.commonName && VALID_LAYERS.includes(String(p.layer)))
    .map(p => ({
      commonName: String(p.commonName),
      scientificName: p.scientificName ? String(p.scientificName) : undefined,
      layer: String(p.layer),
      guildFunctions: Array.isArray(p.guildFunctions) ? (p.guildFunctions as string[]) : undefined,
      sunRequirement: typeof p.sunRequirement === 'string' ? p.sunRequirement : undefined,
      waterRequirement: typeof p.waterRequirement === 'string' ? p.waterRequirement : undefined,
      matureHeight: typeof p.matureHeight === 'number' ? p.matureHeight : undefined,
      matureSpread: typeof p.matureSpread === 'number' ? p.matureSpread : undefined,
      edible: typeof p.edible === 'boolean' ? p.edible : undefined,
      nativeToTexas: typeof p.nativeToTexas === 'boolean' ? p.nativeToTexas : undefined,
      description: typeof p.description === 'string' ? p.description : undefined,
    }));

  return addNewPlantsToDb(candidates);
}
