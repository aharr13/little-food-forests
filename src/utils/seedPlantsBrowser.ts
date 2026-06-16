// src/utils/seedPlantsBrowser.ts
// Browser-side plant database sync. Runs as the logged-in admin, so the
// admin-only Firestore write rule on `plants` is satisfied by the existing
// browser session — no CLI or password needed.
//
// This is a full RECONCILE against the canonical data file (plants-texas.json):
//   - plants in the file but not the DB  -> added
//   - plants in both                     -> overwritten with the file's data
//     (so corrected tags actually take effect)
//   - plants in the DB but not the file  -> removed (stale / duplicate)
// After it runs, the database is an exact mirror of the file.
import { collection, getDocs, addDoc, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export interface SyncResult {
  added: number;
  updated: number;
  removed: number;
  total: number;
}

export async function syncPlantDatabase(
  onProgress?: (message: string) => void
): Promise<SyncResult> {
  onProgress?.('Loading plant data…');
  // Dynamic import keeps the ~117KB plant file out of the main app bundle.
  const mod = await import('../../data/plants-texas.json');
  const plants = ((mod as { default?: unknown }).default ?? mod) as Array<Record<string, unknown>>;
  const fileScis = new Set(
    plants.map(p => String(p.scientificName || '').toLowerCase()).filter(Boolean)
  );

  onProgress?.('Reading current database…');
  const snapshot = await getDocs(collection(db, 'plants'));
  const docIdBySci: Record<string, string> = {};
  const toRemove: string[] = [];
  snapshot.forEach(d => {
    const sci = String((d.data() as { scientificName?: string }).scientificName || '').toLowerCase();
    // Keep the first doc that matches a file plant; everything else (no match,
    // blank name, or a duplicate of an already-kept plant) is stale → remove.
    if (sci && fileScis.has(sci) && !(sci in docIdBySci)) {
      docIdBySci[sci] = d.id;
    } else {
      toRemove.push(d.id);
    }
  });

  let added = 0;
  let updated = 0;
  for (const plant of plants) {
    const sci = String(plant.scientificName || '').toLowerCase();
    const existingId = sci ? docIdBySci[sci] : undefined;
    if (existingId) {
      // Full overwrite so corrected tags replace the stale version.
      await setDoc(doc(db, 'plants', existingId), { ...plant, updatedAt: new Date() });
      updated++;
    } else {
      await addDoc(collection(db, 'plants'), { ...plant, createdAt: new Date(), updatedAt: new Date() });
      added++;
    }
    onProgress?.(`Syncing plants… (${added + updated}/${plants.length})`);
  }

  let removed = 0;
  for (const id of toRemove) {
    await deleteDoc(doc(db, 'plants', id));
    removed++;
    onProgress?.(`Removing stale entries… (${removed})`);
  }

  return { added, updated, removed, total: plants.length };
}
