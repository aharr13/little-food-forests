// src/utils/photoReminderGenerator.ts
import { Shape, PhotoReminder } from '../types';

const DEFAULT_PHOTO_INTERVAL_DAYS = 30; // Monthly
const DEFAULT_XP_PER_PHOTO = 50;

export function generatePhotoReminderForAnchor(
  anchorShape: Shape,
  projectId: string,
  userId: string = '',
): PhotoReminder | null {
  if (!anchorShape.photoAnchor) return null;

  const now = new Date();
  const nextPhotoDate = new Date(now);
  nextPhotoDate.setDate(nextPhotoDate.getDate() + DEFAULT_PHOTO_INTERVAL_DAYS);

  return {
    id: `reminder_${anchorShape.id}_${Date.now()}`,
    projectId,
    userId,
    anchorPointId: anchorShape.id,
    intervalDays: DEFAULT_PHOTO_INTERVAL_DAYS,
    nextPhotoDate,
    photoCount: 0,
    xpPerPhoto: DEFAULT_XP_PER_PHOTO,
    createdAt: now,
  };
}

export function generatePhotoRemindersForProject(
  shapes: Shape[],
  projectId: string,
  userId: string = '',
): PhotoReminder[] {
  // Generate a reminder for each photo anchor
  return shapes
    .filter(s => s.photoAnchor)
    .map(shape => generatePhotoReminderForAnchor(shape, projectId, userId))
    .filter((r): r is PhotoReminder => r !== null);
}
