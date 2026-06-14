// src/components/Canvas/SnapshotGallery.tsx
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { Shape, WaterFeature, FOOD_FOREST_LAYERS } from '../../types';
import { Camera, Trash2, RotateCcw, X, Clock, Leaf, Droplets } from 'lucide-react';
import './SnapshotGallery.css';

interface Snapshot {
  id: string;
  name: string;
  createdAt: Date;
  shapes: Shape[];
  groundcoverSpecies: string[];
  waterFeatures: WaterFeature[];
  shapeCount: number;
  plantCount: number;
  layerCounts: Record<string, number>;
}

interface SnapshotGalleryProps {
  projectId: string;
  currentShapes: Shape[];
  currentGroundcoverSpecies: string[];
  currentWaterFeatures: WaterFeature[];
  onRestore: (shapes: Shape[], groundcoverSpecies: string[], waterFeatures: WaterFeature[]) => void;
  onClose: () => void;
}

export function SnapshotGallery({
  projectId,
  currentShapes,
  currentGroundcoverSpecies,
  currentWaterFeatures,
  onRestore,
  onClose,
}: SnapshotGalleryProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadSnapshots();
  }, [projectId]);

  async function loadSnapshots() {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'projects', projectId, 'snapshots'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const loaded = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
      })) as Snapshot[];
      setSnapshots(loaded);
    } catch (err) {
      console.error('Error loading snapshots:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const layerCounts: Record<string, number> = {};
      FOOD_FOREST_LAYERS.forEach(l => {
        layerCounts[l.id] = currentShapes.filter(s => s.layerId === l.id).length;
      });

      const plantCount = currentShapes.filter(s => s.plantId).length;
      const defaultName = new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
      });

      await addDoc(collection(db, 'projects', projectId, 'snapshots'), {
        name: snapshotName.trim() || defaultName,
        createdAt: new Date(),
        shapes: currentShapes,
        groundcoverSpecies: currentGroundcoverSpecies,
        waterFeatures: currentWaterFeatures,
        shapeCount: currentShapes.length,
        plantCount,
        layerCounts,
      });

      setSnapshotName('');
      await loadSnapshots();
    } catch (err) {
      console.error('Error saving snapshot:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(snapshotId: string) {
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'snapshots', snapshotId));
      setSnapshots(prev => prev.filter(s => s.id !== snapshotId));
    } catch (err) {
      console.error('Error deleting snapshot:', err);
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleRestore(snapshot: Snapshot) {
    onRestore(snapshot.shapes, snapshot.groundcoverSpecies, snapshot.waterFeatures);
    onClose();
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    });
  }

  const activeLayersInCurrent = FOOD_FOREST_LAYERS.filter(
    l => currentShapes.some(s => s.layerId === l.id)
  );

  return (
    <div className="snapshot-overlay" onClick={onClose}>
      <div className="snapshot-gallery" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="snapshot-header">
          <div className="snapshot-header-title">
            <Camera size={20} />
            <h2>Snapshot Gallery</h2>
          </div>
          <button className="snapshot-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Save New Snapshot */}
        <div className="snapshot-save-section">
          <div className="snapshot-current-stats">
            <span><Leaf size={14} /> {currentShapes.length} shapes</span>
            <span>{currentShapes.filter(s => s.plantId).length} plants assigned</span>
            <span>{activeLayersInCurrent.length} layers used</span>
            {currentWaterFeatures.length > 0 && (
              <span><Droplets size={14} /> {currentWaterFeatures.length} water markers</span>
            )}
          </div>
          <div className="snapshot-save-row">
            <input
              type="text"
              placeholder="Name this snapshot (optional)..."
              value={snapshotName}
              onChange={e => setSnapshotName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="snapshot-name-input"
            />
            <button
              className="snapshot-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Snapshot'}
            </button>
          </div>
        </div>

        {/* Gallery */}
        <div className="snapshot-list">
          {loading ? (
            <div className="snapshot-loading">Loading snapshots...</div>
          ) : snapshots.length === 0 ? (
            <div className="snapshot-empty">
              <Camera size={40} />
              <p>No snapshots yet.</p>
              <p>Save one above to capture your design at this moment.</p>
            </div>
          ) : (
            snapshots.map(snapshot => (
              <div key={snapshot.id} className="snapshot-card">
                <div className="snapshot-card-header">
                  <div className="snapshot-card-name">{snapshot.name}</div>
                  <div className="snapshot-card-time">
                    <Clock size={12} />
                    {formatDate(snapshot.createdAt)} at {formatTime(snapshot.createdAt)}
                  </div>
                </div>

                <div className="snapshot-card-stats">
                  <span>{snapshot.shapeCount} shapes</span>
                  <span>{snapshot.plantCount} plants assigned</span>
                  {snapshot.waterFeatures?.length > 0 && (
                    <span>{snapshot.waterFeatures.length} water markers</span>
                  )}
                </div>

                {/* Layer breakdown */}
                <div className="snapshot-layer-bars">
                  {FOOD_FOREST_LAYERS.filter(l => (snapshot.layerCounts?.[l.id] || 0) > 0).map(layer => (
                    <div key={layer.id} className="snapshot-layer-bar" title={`${layer.name}: ${snapshot.layerCounts[layer.id]}`}>
                      <div
                        className="snapshot-layer-bar-fill"
                        style={{
                          background: layer.color,
                          width: `${Math.min(100, (snapshot.layerCounts[layer.id] / Math.max(1, snapshot.shapeCount)) * 100)}%`,
                        }}
                      />
                      <span className="snapshot-layer-label">{layer.name.split(' ')[0]}</span>
                      <span className="snapshot-layer-count">{snapshot.layerCounts[layer.id]}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="snapshot-card-actions">
                  {confirmRestore === snapshot.id ? (
                    <>
                      <span className="snapshot-confirm-text">Replace current design?</span>
                      <button className="snapshot-btn-confirm" onClick={() => handleRestore(snapshot)}>
                        Yes, restore
                      </button>
                      <button className="snapshot-btn-cancel" onClick={() => setConfirmRestore(null)}>
                        Cancel
                      </button>
                    </>
                  ) : confirmDelete === snapshot.id ? (
                    <>
                      <span className="snapshot-confirm-text">Delete this snapshot?</span>
                      <button className="snapshot-btn-danger" onClick={() => handleDelete(snapshot.id)}>
                        Yes, delete
                      </button>
                      <button className="snapshot-btn-cancel" onClick={() => setConfirmDelete(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="snapshot-btn-restore" onClick={() => setConfirmRestore(snapshot.id)}>
                        <RotateCcw size={14} />
                        Restore
                      </button>
                      <button className="snapshot-btn-delete" onClick={() => setConfirmDelete(snapshot.id)}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
