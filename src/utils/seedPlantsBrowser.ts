// src/utils/seedPlantsBrowser.ts
// Browser-side plant database sync. Runs as the logged-in admin, so the
// admin-only Firestore write rule on `plants` is satisfied by the existing
// browser session — no CLI or password needed.
//
// Upserts the canonical seed file (plants-texas.json) into the DB WITHOUT
// removing anything the advisor added:
//   - seed plant missing from the DB        -> added
//   - seed plant already in the DB           -> overwritten with the file's data
//                                               (so corrected tags take effect)
//   - duplicate copies of the SAME seed plant -> extras removed (kept one)
//   - plants NOT in the seed file (advisor-added) -> LEFT ALONE
// The database is a starting point that grows; this never deletes growth.
import { collection, getDocs, addDoc, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export interface SyncResult {
  added: number;
  updated: number;
  duplicatesRemoved: number;
  kept: number; // advisor-added plants left untouched
  total: number;
}

export async function syncPlantDatabase(
  onProgress?: (message: string) => void
): Promise<SyncResult> {
  onProgress?.('Loading plant data…');
  // Dynamic import keeps the plant files out of the main app bundle. The DB is a
  // single shared catalog spanning regions; the advisor filters by the project's
  // climate/zone, so we seed every region's set here.
  const [txMod, caMod] = await Promise.all([
    import('../../data/plants-texas.json'),
    import('../../data/plants-northern-california.json'),
  ]);
  const pick = (m: unknown) => ((m as { default?: unknown }).default ?? m) as Array<Record<string, unknown>>;
  const seenSci = new Set<string>();
  const plants = [...pick(txMod), ...pick(caMod)].filter(p => {
    const sci = String(p.scientificName || '').toLowerCase();
    if (!sci) return true;
    if (seenSci.has(sci)) return false; // same species in two region files — keep first
    seenSci.add(sci);
    return true;
  });
  const fileScis = new Set(
    plants.map(p => String(p.scientificName || '').toLowerCase()).filter(Boolean)
  );

  onProgress?.('Reading current database…');
  const snapshot = await getDocs(collection(db, 'plants'));
  const docIdBySci: Record<string, string> = {};
  const duplicateSeedDocs: string[] = []; // extra copies of a seed plant
  let kept = 0;
  snapshot.forEach(d => {
    const sci = String((d.data() as { scientificName?: string }).scientificName || '').toLowerCase();
    if (sci && fileScis.has(sci)) {
      if (sci in docIdBySci) duplicateSeedDocs.push(d.id); // a 2nd copy of a seed plant
      else docIdBySci[sci] = d.id;
    } else {
      kept++; // not a seed plant -> advisor-added or custom -> never touch
    }
  });

  let added = 0;
  let updated = 0;
  for (const plant of plants) {
    const sci = String(plant.scientificName || '').toLowerCase();
    const existingId = sci ? docIdBySci[sci] : undefined;
    if (existingId) {
      await setDoc(doc(db, 'plants', existingId), { ...plant, updatedAt: new Date() });
      updated++;
    } else {
      await addDoc(collection(db, 'plants'), { ...plant, createdAt: new Date(), updatedAt: new Date() });
      added++;
    }
    onProgress?.(`Syncing plants… (${added + updated}/${plants.length})`);
  }

  // Only remove duplicate copies of SEED plants — never advisor-added plants.
  let duplicatesRemoved = 0;
  for (const id of duplicateSeedDocs) {
    await deleteDoc(doc(db, 'plants', id));
    duplicatesRemoved++;
    onProgress?.(`Cleaning duplicates… (${duplicatesRemoved})`);
  }

  return { added, updated, duplicatesRemoved, kept, total: plants.length };
}
