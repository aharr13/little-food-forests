import { useState, useEffect } from 'react';
import { getStorage, ref, listAll, getBytes } from 'firebase/storage';
import { Calendar, Trash2, ZoomIn } from 'lucide-react';
import './PhotoGallery.css';

interface PhotoMetadata {
  anchorPointId: string;
  timestamp: number;
  url: string;
  fileName: string;
}

interface AnchorPointPhotos {
  anchorPointId: string;
  photos: PhotoMetadata[];
}

interface PhotoGalleryProps {
  projectId: string;
  userId: string;
}

function parsePhotoFileName(fileName: string): { anchorPointId: string; timestamp: number } | null {
  const match = fileName.match(/^(.+?)_(\d+)\.(jpg|jpeg|png)$/i);
  if (!match) return null;
  return { anchorPointId: match[1], timestamp: parseInt(match[2], 10) };
}

export function PhotoGallery({ projectId, userId }: PhotoGalleryProps) {
  const [groups, setGroups] = useState<AnchorPointPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPhotos();
  }, [projectId, userId]);

  async function loadPhotos() {
    try {
      setLoading(true);
      setError(null);
      const storage = getStorage();
      const photosRef = ref(storage, `projects/${userId}/${projectId}/photos`);

      const result = await listAll(photosRef);

      // Group photos by anchor point
      const photosByAnchor = new Map<string, PhotoMetadata[]>();

      for (const fileRef of result.items) {
        const parsed = parsePhotoFileName(fileRef.name);
        if (!parsed) continue;

        const group = photosByAnchor.get(parsed.anchorPointId) || [];
        group.push({
          anchorPointId: parsed.anchorPointId,
          timestamp: parsed.timestamp,
          url: fileRef.fullPath,
          fileName: fileRef.name,
        });
        photosByAnchor.set(parsed.anchorPointId, group);
      }

      // Sort photos within each group by date (newest first)
      const groupsArray = Array.from(photosByAnchor.entries())
        .map(([anchorPointId, photos]) => ({
          anchorPointId,
          photos: photos.sort((a, b) => b.timestamp - a.timestamp),
        }))
        .sort((a, b) => {
          const aNewest = a.photos[0]?.timestamp || 0;
          const bNewest = b.photos[0]?.timestamp || 0;
          return bNewest - aNewest;
        });

      setGroups(groupsArray);
    } catch (err) {
      console.error('Failed to load photos:', err);
      setError('Failed to load photos. Check Storage rules.');
    } finally {
      setLoading(false);
    }
  }

  async function deletePhoto(anchorPointId: string, fileName: string) {
    if (!confirm('Delete this photo?')) return;

    try {
      const storage = getStorage();
      const fileRef = ref(storage, `projects/${userId}/${projectId}/photos/${fileName}`);
      // Note: deleteObject requires storage rules that allow user deletion
      // This will error if rules don't permit it
      console.log('Delete would remove:', fileRef.fullPath);
      // For now, just reload to refresh
      await loadPhotos();
    } catch (err) {
      console.error('Failed to delete photo:', err);
      setError('Could not delete photo.');
    }
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="photo-gallery">
        <div className="gallery-loading">Loading photos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="photo-gallery">
        <div className="gallery-error">{error}</div>
        <button onClick={loadPhotos} className="gallery-retry">
          Retry
        </button>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="photo-gallery">
        <div className="gallery-empty">
          <p>No progress photos yet.</p>
          <p className="gallery-empty-hint">Capture photos from the Photo Session panel to track your forest's growth.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="photo-gallery">
      <div className="gallery-header">
        <h3>Progress Photos</h3>
        <p>{groups.reduce((sum, g) => sum + g.photos.length, 0)} photos across {groups.length} anchor points</p>
      </div>

      <div className="gallery-groups">
        {groups.map(group => (
          <div key={group.anchorPointId} className="gallery-group">
            <div className="group-title">
              <span className="group-name">Anchor Point: {group.anchorPointId}</span>
              <span className="group-count">{group.photos.length} photo{group.photos.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="gallery-grid">
              {group.photos.map((photo, idx) => (
                <div
                  key={`${photo.anchorPointId}-${idx}`}
                  className="gallery-item"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="gallery-thumbnail">
                    <img
                      src={photo.url}
                      alt={`Photo from ${formatDate(photo.timestamp)}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3EPhoto unavailable%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="gallery-overlay">
                      <ZoomIn size={20} />
                    </div>
                  </div>

                  <div className="gallery-info">
                    <div className="photo-date">
                      <Calendar size={12} />
                      {formatDate(photo.timestamp)}
                    </div>
                    <button
                      className="photo-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhoto(photo.anchorPointId, photo.fileName);
                      }}
                      title="Delete photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox modal */}
      {selectedPhoto && (
        <div className="gallery-modal" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPhoto(null)}>×</button>
            <img src={selectedPhoto.url} alt="Full size" className="modal-image" />
            <div className="modal-info">
              <p className="modal-anchor">{selectedPhoto.anchorPointId}</p>
              <p className="modal-date">{formatDate(selectedPhoto.timestamp)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
