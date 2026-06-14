import { useState } from 'react';
import { Camera, Calendar, CheckCircle2, Clock, MoreVertical } from 'lucide-react';
import { PhotoReminder, Shape } from '../../types';
import './PhotoSessionPanel.css';

interface PhotoSessionPanelProps {
  photoReminders: PhotoReminder[];
  shapes: Shape[];
  onStartSession: (reminderId: string) => void;
  onCompletePhoto: (reminderId: string) => Promise<void>;
  onSnooze: (reminderId: string, days: number) => Promise<void>;
}

export function PhotoSessionPanel({
  photoReminders,
  shapes,
  onStartSession,
  onCompletePhoto,
  onSnooze,
}: PhotoSessionPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getDueStatus = (date: Date) => {
    const now = new Date();
    const daysUntil = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { label: 'Overdue', class: 'overdue' };
    if (daysUntil === 0) return { label: 'Today', class: 'today' };
    if (daysUntil <= 7) return { label: `${daysUntil}d`, class: 'soon' };
    return { label: `${daysUntil}d away`, class: 'future' };
  };

  if (photoReminders.length === 0) {
    return (
      <div className="photo-session-empty">
        <Camera size={32} />
        <p>No photo reminders yet. Place anchor points to start stop-motion photos.</p>
      </div>
    );
  }

  return (
    <div className="photo-session-panel">
      <div className="photo-session-header">
        <h3>📸 Photo Sessions</h3>
        <span className="photo-session-count">{photoReminders.length}</span>
      </div>

      <div className="photo-session-list">
        {photoReminders.map(reminder => {
          const anchor = shapes.find(s => s.id === reminder.anchorPointId);
          const dueStatus = getDueStatus(reminder.nextPhotoDate);
          const isExpanded = expandedId === reminder.id;

          return (
            <div key={reminder.id} className={`photo-session-card ${dueStatus.class}`}>
              <div
                className="photo-session-card-header"
                onClick={() => setExpandedId(isExpanded ? null : reminder.id)}
              >
                <div className="photo-session-card-info">
                  <div className="photo-session-title">
                    📷 Anchor {reminder.photoCount > 0 ? `(${reminder.photoCount}✓)` : ''}
                  </div>
                  {anchor && (
                    <p className="photo-session-location">
                      ({anchor.center?.lat.toFixed(4)}, {anchor.center?.lng.toFixed(4)})
                    </p>
                  )}
                </div>
                <div className="photo-session-badge" data-status={dueStatus.class}>
                  {dueStatus.label}
                </div>
              </div>

              {isExpanded && (
                <div className="photo-session-expanded">
                  <div className="photo-session-details">
                    <p><Clock size={14} /> Next photo due: {reminder.nextPhotoDate.toLocaleDateString()}</p>
                    <p><CheckCircle2 size={14} /> Photos taken: {reminder.photoCount}</p>
                    {reminder.lastPhotoDate && (
                      <p><Calendar size={14} /> Last photo: {reminder.lastPhotoDate.toLocaleDateString()}</p>
                    )}
                  </div>

                  <div className="photo-session-actions">
                    <button
                      className="photo-session-btn photo-session-btn-primary"
                      onClick={() => onStartSession(reminder.id)}
                    >
                      <Camera size={16} /> Start Photo Session
                    </button>
                    <button
                      className="photo-session-btn photo-session-btn-secondary"
                      onClick={() => onSnooze(reminder.id, 7)}
                    >
                      Snooze 7d
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
