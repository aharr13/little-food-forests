// src/hooks/useCareItems.ts
import { useState, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { CareItem } from '../types';

export function useCareItems(projectId: string | null, userId: string | null = null) {
  const [careItems, setCareItems] = useState<CareItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !userId) { setCareItems([]); return; }
    setLoading(true);
    // Query by userId (single-field index); filter by projectId in memory.
    const q = query(collection(db, 'careItems'), where('userId', '==', userId));
    getDocs(q).then(snap => {
      const loaded: CareItem[] = snap.docs
        .filter(d => d.data().projectId === projectId)
        .map(d => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            nextDueDate:     data.nextDueDate?.toDate?.()     ?? new Date(),
            lastCompletedAt: data.lastCompletedAt?.toDate?.() ?? undefined,
            createdAt:       data.createdAt?.toDate?.()       ?? new Date(),
          } as CareItem;
        });
      setCareItems(loaded.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime()));
    }).catch(console.error).finally(() => setLoading(false));
  }, [projectId, userId]);

  async function upsertCareItem(item: CareItem) {
    setCareItems(prev => {
      const exists = prev.find(c => c.id === item.id);
      const next = exists
        ? prev.map(c => (c.id === item.id ? item : c))
        : [...prev, item];
      return next.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
    });
    const ref = doc(db, 'careItems', item.id);
    const data = JSON.parse(JSON.stringify(item, (_, v) => (v === undefined ? null : v)));
    await setDoc(ref, data, { merge: true });
  }

  async function completeItem(itemId: string) {
    const item = careItems.find(c => c.id === itemId);
    if (!item) return;

    const now = new Date();

    // Daily first-30-days watering steps down to weekly once 30 days have passed.
    let intervalDays = item.intervalDays;
    let phase = item.phase;
    const daysSinceStart = (now.getTime() - item.createdAt.getTime()) / 86_400_000;
    const isWatering = /water/i.test(item.title);
    if (isWatering && phase === 'first-30-days' && daysSinceStart >= 30) {
      intervalDays = 7;
      phase = 'year-one';
    }

    const nextDueDate = new Date(now);
    nextDueDate.setDate(nextDueDate.getDate() + intervalDays);

    const updated: CareItem = {
      ...item,
      intervalDays,
      phase,
      lastCompletedAt:  now,
      nextDueDate,
      completionCount:  item.completionCount + 1,
      totalXpEarned:    item.totalXpEarned + item.xpPerCompletion,
    };

    await upsertCareItem(updated);
  }

  async function snoozeItem(itemId: string, days: number) {
    const item = careItems.find(c => c.id === itemId);
    if (!item) return;

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + days);

    await upsertCareItem({ ...item, nextDueDate });
  }

  return { careItems, loading, upsertCareItem, completeItem, snoozeItem };
}
