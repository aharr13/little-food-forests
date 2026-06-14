import { useState, useRef } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';
import { Shape } from '../../types';
import './PhotoCaptureModal.css';

interface PhotoCaptureModalProps {
  anchorPoint: Shape;
  projectId: string;
  onPhotoCapture: (file: File, notes: string) => Promise<void>;
  onClose: () => void;
}

export function PhotoCaptureModal({ anchorPoint, projectId, onPhotoCapture, onClose }: PhotoCaptureModalProps) {
  const [mode, setMode] = useState<'camera' | 'upload' | 'preview'>('camera');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setMode('camera');
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Could not access camera. Try uploading a file instead.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    const video = videoRef.current;
    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const dataUrl = canvasRef.current.toDataURL('image/jpeg');
    setPreview(dataUrl);

    // Convert canvas to blob
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const f = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFile(f);
        setMode('preview');
        // Stop video stream
        if (videoRef.current?.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(t => t.stop());
        }
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
      setMode('preview');
    };
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      await onPhotoCapture(file, notes);
      onClose();
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const targetLabel = anchorPoint.targetPoint
    ? `Aim toward: (${anchorPoint.targetPoint.lat.toFixed(4)}, ${anchorPoint.targetPoint.lng.toFixed(4)})`
    : 'No target set';

  return (
    <div className="photo-capture-overlay">
      <div className="photo-capture-modal">
        <div className="photo-capture-header">
          <h3>📷 Capture Progress Photo</h3>
          <button className="photo-capture-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Location Info */}
        <div className="photo-capture-info">
          <p className="photo-location">
            Position: ({anchorPoint.center?.lat.toFixed(4)}, {anchorPoint.center?.lng.toFixed(4)})
          </p>
          <p className="photo-target">{targetLabel}</p>
        </div>

        {/* Camera Mode */}
        {mode === 'camera' && (
          <div className="photo-capture-camera">
            <video ref={videoRef} autoPlay playsInline className="photo-video" />
            <button className="photo-btn photo-btn-primary" onClick={capturePhoto}>
              <Camera size={20} /> Take Photo
            </button>
            <button className="photo-btn photo-btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={20} /> Upload Instead
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Preview Mode */}
        {mode === 'preview' && preview && (
          <div className="photo-capture-preview">
            <img src={preview} alt="Preview" className="photo-preview-img" />
            <textarea
              placeholder="Add notes about this photo (optional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="photo-notes"
              rows={3}
            />
            <div className="photo-capture-actions">
              <button
                className="photo-btn photo-btn-secondary"
                onClick={() => setMode('camera')}
                disabled={loading}
              >
                ← Retake
              </button>
              <button
                className="photo-btn photo-btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                <Check size={20} /> {loading ? 'Uploading...' : 'Confirm & Upload'}
              </button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
