// src/utils/seedPlantsBrowser.ts
// Browser-side plant database sync. Runs as the logged-in admin, so the
// admin-only Firestore write rule on `plants` is satisfied by the existing
// browser session — no CLI or password needed.
// Idempotent: only adds plants that aren't already in the database.
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface SyncResult {
  added: number;
  alreadyPresent: number;
  total: number;
}

export async function syncPlantDatabase(
  onProgress?: (message: string) => void
): Promise<SyncResult> {
  onProgress?.('Loading plant data…');
  // Dynamic import keeps the ~117KB plant file out of the main app bundle.
  const mod = await import('../../data/plants-texas.json');
  const plants = ((mod as { default?: unknown }).default ?? mod) as Array<Record<string, unknown>>;

  onProgress?.('Checking what already exists…');
  const snapshot = await getDocs(collection(db, 'plants'));
  const existing = new Set<string>();
  snapshot.forEach(d => {
    const sci = String((d.data() as { scientificName?: string }).scientificName || '').toLowerCase();
    if (sci) existing.add(sci);
  });

  let added = 0;
  for (const plant of plants) {
    const sci = String(plant.scientificName || '').toLowerCase();
    if (sci && existing.has(sci)) continue;
    await addDoc(collection(db, 'plants'), {
      ...plant,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    added++;
    onProgress?.(`Adding plants… (${added})`);
  }

  return { added, alreadyPresent: existing.size, total: plants.length };
}
