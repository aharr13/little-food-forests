// src/utils/plantDbExpand.ts
// Grows the shared plant database as the advisor introduces new plants.
// When the advisor recommends or places a plant that isn't already in the DB,
// we add it (with the advisor's tags) so it becomes searchable and counts in
// guild analysis from then on. Requires the `plants` create rule (signed-in).
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface CandidatePlant {
  commonName: string;
  scientificName?: string;
  layer: string;
  guildFunctions?: string[];
  sunRequirement?: string;
  waterRequirement?: string;
  matureHeight?: number;
  matureSpread?: number;
  edible?: boolean;
  nativeToTexas?: boolean;
  description?: string;
}

// Adds any candidates not already present (matched by scientific OR common name).
// Best-effort: never throws into the caller (advisor flow must not break).
export async function addNewPlantsToDb(candidates: CandidatePlant[]): Promise<number> {
  try {
    const valid = candidates.filter(c => c && c.commonName && c.layer);
    if (valid.length === 0) return 0;

    const snap = await getDocs(collection(db, 'plants'));
    const existing = new Set<string>();
    snap.forEach(d => {
      const data = d.data() as { scientificName?: string; commonName?: string };
      if (data.scientificName) existing.add(String(data.scientificName).toLowerCase());
      if (data.commonName) existing.add(String(data.commonName).toLowerCase());
    });

    let added = 0;
    for (const c of valid) {
      const sci = (c.scientificName || '').toLowerCase();
      const name = c.commonName.toLowerCase();
      if ((sci && existing.has(sci)) || existing.has(name)) continue;

      await addDoc(collection(db, 'plants'), {
        commonName: c.commonName,
        scientificName: c.scientificName || '',
        description: c.description || 'Introduced by the AI advisor.',
        layerTypes: [c.layer],
        guildFunctions: c.guildFunctions || [],
        hardinessZones: [],
        sunRequirement: c.sunRequirement || 'full-sun',
        waterRequirement: c.waterRequirement || 'moderate',
        matureHeight: c.matureHeight ?? null,
        matureSpread: c.matureSpread ?? null,
        edible: c.edible ?? false,
        nativeToTexas: c.nativeToTexas ?? false,
        regions: [],
        toxicityWarning: null,
        source: 'advisor', // marks advisor-added plants (Sync never deletes these)
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      existing.add(sci || name);
      added++;
    }
    return added;
  } catch (err) {
    console.error('addNewPlantsToDb failed (non-fatal):', err);
    return 0;
  }
}
