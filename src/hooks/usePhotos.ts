// src/hooks/usePhotos.ts
import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { AnchorPointPhoto } from '../types';

export function usePhotos(projectId: string | null, anchorPointId?: string | null) {
  const [photos, setPhotos] = useState<AnchorPointPhoto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) { setPhotos([]); return; }
    setLoading(true);

    const q = query(
      collection(db, 'projects', projectId, 'photos'),
      orderBy('capturedAt', 'desc')
    );

    getDocs(q).then(snap => {
      const loaded: AnchorPointPhoto[] = snap.docs
        .filter(d => {
          if (!anchorPointId) return true;
          return d.data().anchorPointId === anchorPointId;
        })
        .map(d => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            capturedAt: data.capturedAt?.toDate?.() ?? new Date(),
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          } as AnchorPointPhoto;
        });
      setPhotos(loaded);
    }).catch(console.error).finally(() => setLoading(false));
  }, [projectId, anchorPointId]);

  async function deletePhoto(photoId: string) {
    if (!projectId) return;
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    const ref = doc(db, 'projects', projectId, 'photos', photoId);
    await deleteDoc(ref);
  }

  return { photos, loading, deletePhoto };
}
