import { useState } from 'react';
import { X, Trash2, Camera } from 'lucide-react';
import { AnchorPointPhoto, Shape } from '../../types';
import './PhotoGallery.css';

interface PhotoGalleryProps {
  projectId: string;
  photos: AnchorPointPhoto[];
  shapes: Shape[];
  anchorPointId?: string;
  onDeletePhoto: (photoId: string) => Promise<void>;
  onClose: () => void;
}

function formatDateTime(date: Date) {
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return { dateStr, timeStr };
}

export function PhotoGallery({
  projectId,
  photos,
  shapes,
  anchorPointId,
  onDeletePhoto,
  onClose,
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<AnchorPointPhoto | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const displayPhotos = anchorPointId
    ? photos.filter(p => p.anchorPointId === anchorPointId)
    : photos;

  const getAnchorInfo = (id: string) => {
    const shape = shapes.find(s => s.id === id);
    return shape?.center
      ? `📍 (${shape.center.lat.toFixed(4)}, ${shape.center.lng.toFixed(4)})`
      : '📍 Unknown';
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;
    setDeleting(photoId);
    try {
      await onDeletePhoto(photoId);
    } finally {
      setDeleting(null);
    }
  };

  if (displayPhotos.length === 0) {
    return (
      <div className="photo-gallery-empty">
        <Camera size={40} />
        <p>No photos yet</p>
        <small>{anchorPointId ? 'Capture photos at this anchor point' : 'Start capturing progress photos'}</small>
      </div>
    );
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="photo-gallery">
        {displayPhotos.map(photo => {
          const { dateStr, timeStr } = formatDateTime(photo.capturedAt);
          const anchorInfo = getAnchorInfo(photo.anchorPointId);

          return (
            <div key={photo.id} className="photo-card">
              <div
                className="photo-card-image"
                onClick={() => setSelectedPhoto(photo)}
                style={{ backgroundImage: `url(${photo.photoUrl})` }}
              />
              <div className="photo-card-content">
                <p className="photo-card-location">{anchorInfo}</p>
                <p className="photo-card-date">
                  <span>{dateStr}</span>
                  <span className="photo-card-time">{timeStr}</span>
                </p>
                {photo.notes && <p className="photo-card-notes">{photo.notes}</p>}
                <button
                  className="photo-card-delete"
                  onClick={() => handleDelete(photo.id)}
                  disabled={deleting === photo.id}
                  title="Delete photo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-size Modal */}
      {selectedPhoto && (
        <div className="photo-modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-modal" onClick={e => e.stopPropagation()}>
            <button className="photo-modal-close" onClick={() => setSelectedPhoto(null)}>
              <X size={24} />
            </button>
            <img src={selectedPhoto.photoUrl} alt="Full size" className="photo-modal-image" />
            <div className="photo-modal-info">
              <p><strong>{getAnchorInfo(selectedPhoto.anchorPointId)}</strong></p>
              <p className="photo-modal-date">
                {formatDateTime(selectedPhoto.capturedAt).dateStr} at{' '}
                {formatDateTime(selectedPhoto.capturedAt).timeStr}
              </p>
              {selectedPhoto.notes && <p className="photo-modal-notes">"{selectedPhoto.notes}"</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
