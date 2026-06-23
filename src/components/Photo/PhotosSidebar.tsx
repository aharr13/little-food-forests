// src/components/Photo/PhotosSidebar.tsx
// The "Photos" tab of the map sidebar. Lists photo positions (anchors) and
// placed plants; selecting one highlights it on the map (via onSelect), and you
// can rename/delete positions or shoot/review photos right here. New positions
// are dropped by clicking the map while this tab is open.
import { useState } from 'react';
import { Camera, MapPin, Leaf, Loader, History } from 'lucide-react';
import { Shape, AnchorPointPhoto } from '../../types';
import { usePhotos } from '../../hooks/usePhotos';
import { uploadPhoto } from '../../utils/photoUploader';
import { CameraCapture } from './CameraCapture';
import { PhotoTimeline } from './PhotoTimeline';

interface PhotosSidebarProps {
  projectId: string;
  userId: string;
  shapes: Shape[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRenameAnchor: (id: string, label: string) => void;
  onDeleteAnchor: (id: string) => void;
}

type Capturing =
  | { kind: 'anchor'; shape: Shape; label: string; ghostUrl: string | null }
  | { kind: 'plant'; shape: Shape; ghostUrl: string | null }
  | null;
type Viewing = { title: string; subtitle?: string; photos: AnchorPointPhoto[] } | null;

export function PhotosSidebar({ projectId, userId, shapes, selectedId, onSelect, onRenameAnchor, onDeleteAnchor }: PhotosSidebarProps) {
  const { photos, addPhoto, deletePhoto } = usePhotos(projectId);
  const [tab, setTab] = useState<'positions' | 'plants'>('positions');
  const [capturing, setCapturing] = useState<Capturing>(null);
  const [viewing, setViewing] = useState<Viewing>(null);
  const [saving, setSaving] = useState(false);

  const anchors = shapes.filter(s => s.photoAnchor && s.center);
  const plants = shapes.filter(s => s.plantName && !s.photoAnchor);
  const photosWhere = (pred: (p: AnchorPointPhoto) => boolean) => photos.filter(pred);
  const lastAnchorPhoto = (id: string) => photos.find(p => p.kind === 'anchor' && p.anchorPointId === id) ?? null;
  const lastPlantPhoto = (id: string) => photos.find(p => p.kind === 'plant' && p.shapeId === id) ?? null;

  async function handleCapture(blob: Blob, dims: { width: number; height: number }) {
    if (!capturing) return;
    setSaving(true);
    try {
      const { url, storagePath } = await uploadPhoto(blob, { projectId, userId });
      const base = { projectId, userId, photoUrl: url, storagePath, capturedAt: new Date(), width: dims.width, height: dims.height };
      if (capturing.kind === 'anchor') {
        await addPhoto({ ...base, kind: 'anchor', anchorPointId: capturing.shape.id, anchorPositionLabel: capturing.label });
      } else {
        await addPhoto({ ...base, kind: 'plant', anchorPointId: '', shapeId: capturing.shape.id, plantName: capturing.shape.plantName, plantScientificName: capturing.shape.plantScientificName });
      }
      setCapturing(null);
    } catch (err) {
      console.error('Photo save failed:', err);
      alert('Could not save the photo. ' + (err instanceof Error ? err.message : ''));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sidebar-section">
      {/* tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['positions', 'plants'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '7px', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
              border: '1px solid ' + (tab === t ? '#2563eb' : '#e2e8f0'),
              background: tab === t ? '#eff6ff' : '#fff', color: tab === t ? '#1e3a8a' : '#64748b',
            }}
          >
            {t === 'positions' ? `Positions (${anchors.length})` : `Plants (${plants.length})`}
          </button>
        ))}
      </div>

      {tab === 'positions' && (
        <>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
            <MapPin size={12} style={{ verticalAlign: '-1px' }} /> Click the map to drop a new position. Shift+click to set its aim direction.
          </p>
          {anchors.length === 0
            ? <Empty icon={<MapPin size={22} />} text="No photo positions yet." />
            : anchors.map((a, i) => {
                const name = a.anchorLabel?.trim() || `Position ${i + 1}`;
                const last = lastAnchorPhoto(a.id);
                const count = photosWhere(p => p.kind === 'anchor' && p.anchorPointId === a.id).length;
                return (
                  <PhotoRow
                    key={a.id} num={i + 1} thumb={last?.photoUrl} count={count}
                    selected={selectedId === a.id} onSelect={() => onSelect(a.id)}
                    nameNode={
                      <input
                        className="anchor-name-input" value={a.anchorLabel ?? ''} placeholder={`Position ${i + 1}`}
                        onFocus={() => onSelect(a.id)}
                        onChange={e => onRenameAnchor(a.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
                    }
                    subtitle={count ? `${count} photo${count !== 1 ? 's' : ''} · last ${timeAgo(last!.capturedAt)}` : 'No photos yet'}
                    onShoot={() => setCapturing({ kind: 'anchor', shape: a, label: name, ghostUrl: last?.photoUrl ?? null })}
                    onView={count ? () => setViewing({ title: name, subtitle: `${count} photo${count !== 1 ? 's' : ''}`, photos: photosWhere(p => p.kind === 'anchor' && p.anchorPointId === a.id) }) : undefined}
                    onDelete={() => { if (confirm(`Delete ${name}? Photos already taken are kept.`)) onDeleteAnchor(a.id); }}
                  />
                );
              })}
        </>
      )}

      {tab === 'plants' && (
        plants.length === 0
          ? <Empty icon={<Leaf size={22} />} text="No plants placed yet. Add plants on the map first." />
          : plants.map(s => {
              const last = lastPlantPhoto(s.id);
              const count = photosWhere(p => p.kind === 'plant' && p.shapeId === s.id).length;
              return (
                <PhotoRow
                  key={s.id} thumb={last?.photoUrl} count={count}
                  selected={selectedId === s.id} onSelect={() => onSelect(s.id)}
                  nameNode={<span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{s.plantName}</span>}
                  subtitle={count ? `${count} photo${count !== 1 ? 's' : ''} · last ${timeAgo(last!.capturedAt)}` : (s.plantScientificName || 'No photos yet')}
                  onShoot={() => setCapturing({ kind: 'plant', shape: s, ghostUrl: last?.photoUrl ?? null })}
                  onView={count ? () => setViewing({ title: s.plantName || 'Plant', subtitle: s.plantScientificName, photos: photosWhere(p => p.kind === 'plant' && p.shapeId === s.id) }) : undefined}
                />
              );
            })
      )}

      {capturing && (
        <>
          <CameraCapture
            title={capturing.kind === 'anchor' ? capturing.label : (capturing.shape.plantName || 'Plant')}
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
      )}

      {viewing && (
        <PhotoTimeline
          title={viewing.title} subtitle={viewing.subtitle} photos={viewing.photos}
          onClose={() => setViewing(null)}
          onDelete={async (p) => { await deletePhoto(p); setViewing(v => v ? { ...v, photos: v.photos.filter(x => x.id !== p.id) } : v); }}
        />
      )}
    </div>
  );
}

function PhotoRow({ num, thumb, count, selected, onSelect, nameNode, subtitle, onShoot, onView, onDelete }: {
  num?: number; thumb?: string; count: number; selected: boolean; onSelect: () => void;
  nameNode: React.ReactNode; subtitle: string; onShoot: () => void; onView?: () => void; onDelete?: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        border: '1px solid ' + (selected ? '#2563eb' : '#e2e8f0'), borderRadius: 10, padding: 8, marginBottom: 8, cursor: 'pointer',
        background: selected ? '#eff6ff' : '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {num !== undefined && (
          <span style={{ width: 20, height: 20, flexShrink: 0, borderRadius: '50%', background: '#3b82f6', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{num}</span>
        )}
        <div style={{ position: 'relative', width: 38, height: 38, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {thumb ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={16} color="#94a3b8" />}
          {count > 1 && <span style={{ position: 'absolute', bottom: 1, right: 1, background: 'rgba(0,0,0,0.65)', color: '#fff', borderRadius: 4, fontSize: 9, padding: '0 3px', display: 'flex', alignItems: 'center', gap: 1 }}><History size={8} />{count}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>{nameNode}</div>
        {onDelete && (
          <button className="anchor-del" title="Delete position" onClick={e => { e.stopPropagation(); onDelete(); }}>×</button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <span style={{ flex: 1, fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</span>
        {onView && (
          <button onClick={e => { e.stopPropagation(); onView(); }} style={btn('#f1f5f9', '#334155')}><History size={13} /> History</button>
        )}
        <button onClick={e => { e.stopPropagation(); onShoot(); }} style={btn('#059669', '#fff')}><Camera size={13} /> Shoot</button>
      </div>
    </div>
  );
}

function btn(bg: string, color: string): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, border: 'none', borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 };
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {icon}<p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>{text}</p>
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
