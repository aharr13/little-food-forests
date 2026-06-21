// src/utils/gamification.ts
// Pure helpers that turn a cumulative XP total into a level, title, and
// progress toward the next level. XP itself is derived elsewhere (sum of
// task + care XP earned); these functions never read or write storage.
import { LEVELS, Level } from '../data/levels';

export function getLevel(totalXp: number): Level {
  let cur = LEVELS[0];
  for (const l of LEVELS) {
    if (totalXp >= l.xpRequired) cur = l;
    else break;
  }
  return cur;
}

export function getNextLevel(totalXp: number): Level | null {
  return LEVELS.find(l => l.xpRequired > totalXp) ?? null; // null = max level reached
}

// 0..1 progress through the current level, for the XP bar.
export function levelProgress(totalXp: number): number {
  const cur = getLevel(totalXp);
  const next = getNextLevel(totalXp);
  if (!next) return 1;
  return (totalXp - cur.xpRequired) / (next.xpRequired - cur.xpRequired);
}

// XP still needed to reach the next level (0 at max level).
export function xpToNextLevel(totalXp: number): number {
  const next = getNextLevel(totalXp);
  return next ? next.xpRequired - totalXp : 0;
}
