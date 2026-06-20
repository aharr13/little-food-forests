// src/utils/photoUploader.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

export interface UploadedPhoto {
  url: string;
  storagePath: string;
}

// Uploads an image blob/file to Storage under the owner's project folder.
// Path: projects/{userId}/{projectId}/photos/{timestamp}_{rand}.jpg
export async function uploadPhoto(
  blob: Blob,
  opts: { projectId: string; userId: string },
): Promise<UploadedPhoto> {
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const storagePath = `projects/${opts.userId}/${opts.projectId}/photos/${filename}`;
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(snapshot.ref);
  return { url, storagePath };
}

export async function deletePhotoFromStorage(storagePath: string): Promise<void> {
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (err) {
    // Already gone / permission — non-fatal for the UI.
    console.warn('deletePhotoFromStorage failed:', err);
  }
}

// Read an image blob's pixel dimensions (for ghost-overlay aspect + galleries).
export function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
