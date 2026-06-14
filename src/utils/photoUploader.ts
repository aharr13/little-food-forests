// src/utils/photoUploader.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export async function uploadPhotoToFirebaseStorage(
  file: File,
  projectId: string,
  userId: string,
  anchorPointId: string,
): Promise<string> {
  // Create a unique filename
  const timestamp = Date.now();
  const filename = `${anchorPointId}_${timestamp}.jpg`;

  // Create storage path: projects/{userId}/{projectId}/photos/{filename}
  const storagePath = `projects/${userId}/${projectId}/photos/${filename}`;
  const storageRef = ref(storage, storagePath);

  // Upload the file
  const snapshot = await uploadBytes(storageRef, file);

  // Get download URL
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}
