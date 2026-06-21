// src/components/Photo/CameraCapture.tsx
// Full-screen live camera. Optional ghost overlay (last photo) to line up the
// same shot for time-lapse. Returns a JPEG blob + dimensions on capture.
import { useEffect, useRef, useState } from 'react';
import { X, RefreshCw, Camera as CameraIcon } from 'lucide-react';

interface CameraCaptureProps {
  title: string;
  ghostUrl?: string | null;     // last photo at this position, for alignment
  onCapture: (blob: Blob, dims: { width: number; height: number }) => void;
  onCancel: () => void;
}

export function CameraCapture({ title, ghostUrl, onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [ghostOpacity, setGhostOpacity] = useState(0.4);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: facing }, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(e => setError('Could not access the camera. ' + (e?.message || 'Check camera permissions.')));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setBusy(true);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setBusy(false); return; }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      blob => {
        setBusy(false);
        if (blob) onCapture(blob, { width: canvas.width, height: canvas.height });
      },
      'image/jpeg',
      0.9,
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 5000, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', paddingTop: 'calc(12px + env(safe-area-inset-top))', color: '#fff', background: 'rgba(0,0,0,0.5)' }}>
        <button onClick={onCancel} style={iconBtn}><X size={22} /></button>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
        <button onClick={() => setFacing(f => (f === 'environment' ? 'user' : 'environment'))} style={iconBtn}><RefreshCw size={20} /></button>
      </div>

      {/* Camera view */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {error ? (
          <div style={{ color: '#fff', padding: 24, textAlign: 'center', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>{error}</div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {ghostUrl && !error && (
          <img
            src={ghostUrl}
            alt="previous shot"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: ghostOpacity, pointerEvents: 'none' }}
          />
        )}
      </div>

      {/* Controls */}
      <div style={{ background: 'rgba(0,0,0,0.6)', padding: '12px 16px 24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))', color: '#fff' }}>
        {ghostUrl && !error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 13 }}>
            <span>Align with last shot</span>
            <input type="range" min={0} max={0.8} step={0.05} value={ghostOpacity} onChange={e => setGhostOpacity(Number(e.target.value))} style={{ flex: 1 }} />
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={capture}
            disabled={busy || !!error}
            style={{
              width: 72, height: 72, borderRadius: '50%', background: '#fff', border: '4px solid #94a3b8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#064e3b',
            }}
            aria-label="Capture"
          >
            <CameraIcon size={30} />
          </button>
        </div>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 6,
};
