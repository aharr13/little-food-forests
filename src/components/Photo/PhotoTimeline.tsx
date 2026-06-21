// src/components/Photo/PhotoTimeline.tsx
// A scrollable timeline of photos (a position over time, or all photos of a
// plant/species), chronological, with a tap-to-zoom lightbox and delete.
import { useState } from 'react';
import { ArrowLeft, Trash2, X } from 'lucide-react';
import { AnchorPointPhoto } from '../../types';

interface PhotoTimelineProps {
  title: string;
  subtitle?: string;
  photos: AnchorPointPhoto[];
  onClose: () => void;
  onDelete: (photo: AnchorPointPhoto) => void;
}

export function PhotoTimeline({ title, subtitle, photos, onClose, onDelete }: PhotoTimelineProps) {
  // Oldest → newest reads like a growth sequence.
  const ordered = [...photos].sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
  const [zoom, setZoom] = useState<AnchorPointPhoto | null>(null);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f8fafc', zIndex: 4500, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#064e3b', color: '#fff' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}><ArrowLeft size={22} /></button>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h2>
          {subtitle && <div style={{ fontSize: 12, opacity: 0.85 }}>{subtitle}</div>}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {ordered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>No photos yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))', gap: 8 }}>
            {ordered.map(p => (
              <button key={p.id} onClick={() => setZoom(p)} style={{ border: 'none', padding: 0, background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ aspectRatio: '1 / 1', borderRadius: 10, overflow: 'hidden', background: '#e2e8f0' }}>
                  <img src={p.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{p.capturedAt.toLocaleDateString()}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {zoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 5000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, color: '#fff' }}>
            <span style={{ fontSize: 14 }}>{zoom.capturedAt.toLocaleString()}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { onDelete(zoom); setZoom(null); }}
                style={{ background: 'rgba(220,38,38,0.85)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={16} /> Delete
              </button>
              <button onClick={() => setZoom(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 6 }}><X size={24} /></button>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, overflow: 'hidden' }}>
            <img src={zoom.photoUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        </div>
      )}
    </div>
  );
}
