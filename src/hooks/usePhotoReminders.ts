// src/hooks/usePhotoReminders.ts
import { useState, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { PhotoReminder } from '../types';

export function usePhotoReminders(projectId: string | null, userId: string | null = null) {
  const [photoReminders, setPhotoReminders] = useState<PhotoReminder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !userId) { setPhotoReminders([]); return; }
    setLoading(true);
    // Query by userId; filter by projectId in memory
    const q = query(collection(db, 'photoReminders'), where('userId', '==', userId));
    getDocs(q).then(snap => {
      const loaded: PhotoReminder[] = snap.docs
        .filter(d => d.data().projectId === projectId)
        .map(d => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            nextPhotoDate: data.nextPhotoDate?.toDate?.()   ?? new Date(),
            lastPhotoDate: data.lastPhotoDate?.toDate?.()   ?? undefined,
            createdAt:     data.createdAt?.toDate?.()       ?? new Date(),
          } as PhotoReminder;
        });
      setPhotoReminders(loaded.sort((a, b) => a.nextPhotoDate.getTime() - b.nextPhotoDate.getTime()));
    }).catch(console.error).finally(() => setLoading(false));
  }, [projectId, userId]);

  async function upsertPhotoReminder(reminder: PhotoReminder) {
    setPhotoReminders(prev => {
      const exists = prev.find(r => r.id === reminder.id);
      const next = exists
        ? prev.map(r => (r.id === reminder.id ? reminder : r))
        : [...prev, reminder];
      return next.sort((a, b) => a.nextPhotoDate.getTime() - b.nextPhotoDate.getTime());
    });
    const ref = doc(db, 'photoReminders', reminder.id);
    const data = JSON.parse(JSON.stringify(reminder, (_, v) => (v === undefined ? null : v)));
    await setDoc(ref, data, { merge: true });
  }

  async function completePhotoReminder(reminderId: string) {
    const reminder = photoReminders.find(r => r.id === reminderId);
    if (!reminder) return;

    const now = new Date();
    const nextPhotoDate = new Date(now);
    nextPhotoDate.setDate(nextPhotoDate.getDate() + reminder.intervalDays);

    const updated: PhotoReminder = {
      ...reminder,
      lastPhotoDate: now,
      nextPhotoDate,
      photoCount: reminder.photoCount + 1,
    };

    await upsertPhotoReminder(updated);
  }

  async function snoozePhotoReminder(reminderId: string, days: number) {
    const reminder = photoReminders.find(r => r.id === reminderId);
    if (!reminder) return;

    const nextPhotoDate = new Date();
    nextPhotoDate.setDate(nextPhotoDate.getDate() + days);

    await upsertPhotoReminder({ ...reminder, nextPhotoDate });
  }

  return { photoReminders, loading, upsertPhotoReminder, completePhotoReminder, snoozePhotoReminder };
}
