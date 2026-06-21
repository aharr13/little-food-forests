// src/components/Gamification/LevelBar.tsx
// Compact level + XP indicator. Pure display: give it a cumulative XP total and
// it shows the current punny title, level number, a progress bar toward the
// next level, and the XP remaining. Built on the LEVELS ladder in data/levels.
import { Trophy } from 'lucide-react';
import { getLevel, getNextLevel, levelProgress, xpToNextLevel } from '../../utils/gamification';

export function LevelBar({ totalXp }: { totalXp: number }) {
  const level = getLevel(totalXp);
  const next = getNextLevel(totalXp);
  const pct = Math.round(levelProgress(totalXp) * 100);
  const remaining = xpToNextLevel(totalXp);

  return (
    <div title={`${totalXp} XP total`} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', background: '#fffbeb', border: '2px solid #f59e0b', color: '#b45309', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
        {level.level}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <Trophy size={13} color="#f59e0b" />
          {level.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 120, height: 6, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#059669,#10b981)', borderRadius: 999, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
            {next ? `${remaining} XP to Lv ${next.level}` : 'Max level!'}
          </span>
        </div>
      </div>
    </div>
  );
}
