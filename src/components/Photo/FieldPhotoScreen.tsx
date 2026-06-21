// src/components/Photo/FieldPhotoScreen.tsx
// Phone-first photo tool: capture time-lapse photos from fixed anchor positions
// (1, 2, 3…) and tagged photos of specific plants. Each capture uploads to
// Storage and records a photo doc (tagged by instance + species for plants).
import { useState } from 'react';
import { ArrowLeft, Camera, MapPin, Leaf, Loader } from 'lucide-react';
import { Shape, AnchorPointPhoto } from '../../types';
import { usePhotos } from '../../hooks/usePhotos';
import { uploadPhoto } from '../../utils/photoUploader';
import { CameraCapture } from './CameraCapture';

interface FieldPhotoScreenProps {
  projectId: string;
  userId: string;
  shapes: Shape[];
  onClose: () => void;
}

type Capturing =
  | { kind: 'anchor'; shape: Shape; label: string; ghostUrl: string | null }
  | { kind: 'plant'; shape: Shape; ghostUrl: string | null }
  | null;

export function FieldPhotoScreen({ projectId, userId, shapes, onClose }: FieldPhotoScreenProps) {
  const { photos, addPhoto } = usePhotos(projectId);
  const [tab, setTab] = useState<'positions' | 'plants'>('positions');
  const [capturing, setCapturing] = useState<Capturing>(null);
  const [saving, setSaving] = useState(false);

  const anchors = shapes.filter(s => s.photoAnchor);
  const plants = shapes.filter(s => s.plantName && !s.photoAnchor);

  const lastAnchorPhoto = (anchorId: string) =>
    photos.find(p => p.kind === 'anchor' && p.anchorPointId === anchorId) ?? null;
  const lastPlantPhoto = (shapeId: string) =>
    photos.find(p => p.kind === 'plant' && p.shapeId === shapeId) ?? null;
  const countFor = (pred: (p: AnchorPointPhoto) => boolean) => photos.filter(pred).length;

  async function handleCapture(blob: Blob, dims: { width: number; height: number }) {
    if (!capturing) return;
    setSaving(true);
    try {
      const { url, storagePath } = await uploadPhoto(blob, { projectId, userId });
      const base = {
        projectId, userId, photoUrl: url, storagePath,
        capturedAt: new Date(), width: dims.width, height: dims.height,
      };
      if (capturing.kind === 'anchor') {
        await addPhoto({ ...base, kind: 'anchor', anchorPointId: capturing.shape.id, anchorPositionLabel: capturing.label });
      } else {
        await addPhoto({
          ...base, kind: 'plant', anchorPointId: '',
          shapeId: capturing.shape.id,
          plantName: capturing.shape.plantName,
          plantScientificName: capturing.shape.plantScientificName,
        });
      }
      setCapturing(null);
    } catch (err) {
      console.error('Photo save failed:', err);
      alert('Could not save the photo. ' + (err instanceof Error ? err.message : ''));
    } finally {
      setSaving(false);
    }
  }

  if (capturing) {
    return (
      <>
        <CameraCapture
          title={capturing.kind === 'anchor' ? `Position ${capturing.label}` : (capturing.shape.plantName || 'Plant')}
          ghostUrl={capturing.ghostUrl}
          onCapture={handleCapture}
          onCancel={() => setCapturing(null)}
        />
        {saving && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 10 }}>
            <Loader className="spinner" size={22} /> Saving…
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f8fafc', zIndex: 4000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#064e3b', color: '#fff' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}><ArrowLeft size={22} /></button>
        <h2 style={{ margin: 0, fontSize: 18 }}>📸 Photos</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
        {(['positions', 'plants'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: tab === t ? '#fff' : '#f1f5f9',
              color: tab === t ? '#064e3b' : '#64748b',
              borderBottom: tab === t ? '3px solid #059669' : '3px solid transparent',
            }}
          >
            {t === 'positions' ? `Positions (${anchors.length})` : `Plants (${plants.length})`}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {tab === 'positions' && (
          anchors.length === 0 ? (
            <Empty icon={<MapPin size={28} />} text="No photo positions yet. On the map, use the Photo Anchors tool to drop spots you'll photograph over time." />
          ) : (
            anchors.map((a, i) => {
              const label = String(i + 1);
              const last = lastAnchorPhoto(a.id);
              const count = countFor(p => p.kind === 'anchor' && p.anchorPointId === a.id);
              return (
                <Row
                  key={a.id}
                  thumb={last?.photoUrl}
                  title={`Position ${label}`}
                  subtitle={count ? `${count} photo${count !== 1 ? 's' : ''} · last ${timeAgo(last!.capturedAt)}` : 'No photos yet'}
                  onClick={() => setCapturing({ kind: 'anchor', shape: a, label, ghostUrl: last?.photoUrl ?? null })}
                />
              );
            })
          )
        )}

        {tab === 'plants' && (
          plants.length === 0 ? (
            <Empty icon={<Leaf size={28} />} text="No plants placed yet. Add plants on the map, then photograph them here over time." />
          ) : (
            plants.map(s => {
              const last = lastPlantPhoto(s.id);
              const count = countFor(p => p.kind === 'plant' && p.shapeId === s.id);
              return (
                <Row
                  key={s.id}
                  thumb={last?.photoUrl}
                  title={s.plantName || 'Plant'}
                  subtitle={count ? `${count} photo${count !== 1 ? 's' : ''} · last ${timeAgo(last!.capturedAt)}` : (s.plantScientificName || 'No photos yet')}
                  onClick={() => setCapturing({ kind: 'plant', shape: s, ghostUrl: last?.photoUrl ?? null })}
                />
              );
            })
          )
        )}
      </div>
    </div>
  );
}

function Row({ thumb, title, subtitle, onClick }: { thumb?: string; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 10, marginBottom: 10, cursor: 'pointer',
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 10, background: '#e2e8f0', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {thumb ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={22} color="#94a3b8" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>{title}</div>
        <div style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>
      </div>
      <div style={{ background: '#059669', color: '#fff', borderRadius: 999, padding: '8px 12px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Camera size={16} /> Shoot
      </div>
    </button>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ color: '#94a3b8' }}>{icon}</div>
      <p style={{ margin: 0, lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

function timeAgo(d: Date): string {
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}
