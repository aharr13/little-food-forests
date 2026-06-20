// src/hooks/usePhotos.ts
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { AnchorPointPhoto } from '../types';
import { deletePhotoFromStorage } from '../utils/photoUploader';

// Loads every photo for a project (anchor + plant), newest first. Consumers
// filter by anchor position or plant as needed (see the galleries).
export function usePhotos(projectId: string | null) {
  const [photos, setPhotos] = useState<AnchorPointPhoto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) { setPhotos([]); return; }
    setLoading(true);
    const q = query(collection(db, 'projects', projectId, 'photos'), orderBy('capturedAt', 'desc'));
    getDocs(q).then(snap => {
      setPhotos(snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          capturedAt: data.capturedAt?.toDate?.() ?? new Date(),
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        } as AnchorPointPhoto;
      }));
    }).catch(console.error).finally(() => setLoading(false));
  }, [projectId]);

  async function addPhoto(record: Omit<AnchorPointPhoto, 'id' | 'createdAt'>): Promise<string | null> {
    if (!projectId) return null;
    const createdAt = new Date();
    // Firestore rejects undefined — drop empty optional fields.
    const data: Record<string, unknown> = { createdAt };
    Object.entries(record).forEach(([k, v]) => { if (v !== undefined) data[k] = v; });
    const ref = await addDoc(collection(db, 'projects', projectId, 'photos'), data);
    setPhotos(prev => [{ ...record, id: ref.id, createdAt } as AnchorPointPhoto, ...prev]);
    return ref.id;
  }

  async function deletePhoto(photo: AnchorPointPhoto) {
    if (!projectId) return;
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
    await deleteDoc(doc(db, 'projects', projectId, 'photos', photo.id));
    if (photo.storagePath) await deletePhotoFromStorage(photo.storagePath);
  }

  return { photos, loading, addPhoto, deletePhoto };
}
