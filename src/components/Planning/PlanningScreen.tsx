// src/components/Planning/PlanningScreen.tsx
import { useState } from 'react';
import { MapContainer, TileLayer, Circle as LeafletCircle, Polygon as LeafletPolygon, Tooltip } from 'react-leaflet';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, ArrowLeft, Clock, CalendarDays, ListTodo, FileText, Camera, Image } from 'lucide-react';
import { LevelBar } from '../Gamification/LevelBar';
import { FOOD_FOREST_LAYERS, Shape, PlantingTask, TaskStep, CareItem, PhotoReminder } from '../../types';
import { computeScheduledDate } from '../../utils/taskGenerator';
import { CalendarView } from './CalendarView';
import { DesignReport } from '../Design/DesignReport';
import { PhotoSessionPanel } from './PhotoSessionPanel';
import { PhotoGallery } from '../Design/PhotoGallery';
import './PlanningScreen.css';

const PHASE_LABELS: Record<string, string> = {
  'preparation':    '🏗️ Preparation',
  'planting-day':   '🌱 Planting Day',
  'first-30-days':  '💧 First 30 Days',
  'year-one':       '🌳 Year One',
};

const ORDER_GROUPS: { label: string; min: number; max: number; color: string }[] = [
  { label: 'Plant First',  min: 0, max: 2.9, color: '#059669' },
  { label: 'Plant Second', min: 3, max: 3.9, color: '#2563eb' },
  { label: 'Plant Third',  min: 4, max: 4.9, color: '#7c3aed' },
  { label: 'Plant Last',   min: 5, max: 99,  color: '#d97706' },
];

function getOrderGroup(order: number) {
  return ORDER_GROUPS.find(g => order >= g.min && order <= g.max) ?? ORDER_GROUPS[3];
}

// Effective planting date: the task's scheduledDate, or a season-based default
// for older tasks that predate scheduling.
function effectiveDate(task: PlantingTask): Date {
  return task.scheduledDate ?? computeScheduledDate(task.layerId, task.bestPlantingWindow);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function monthKey(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// yyyy-mm-dd for <input type="date">
function dateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type TimeFilter = 'all' | 'day' | 'week' | 'month';

// Is the date due within the chosen horizon? (overdue items always pass.)
function withinFilter(d: Date, filter: TimeFilter): boolean {
  if (filter === 'all') return true;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  if (filter === 'week') end.setDate(end.getDate() + 7);
  if (filter === 'month') end.setDate(end.getDate() + 30);
  return d.getTime() <= end.getTime();
}

function progressPercent(task: PlantingTask): number {
  if (!task.steps.length) return 0;
  return Math.round((task.steps.filter(s => s.completed).length / task.steps.length) * 100);
}

function formatDueDate(date: Date): string {
  const now = new Date();
  const diff = Math.floor((date.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return `in ${diff}d`;
}

// ── Task Card (for planned / one-time planting tasks) ────────────────────────

interface TaskCardProps {
  task: PlantingTask;
  isActive: boolean;
  showPlantingBadge?: boolean;
  onSelect: () => void;
  onCompleteStep: (stepId: string) => void;
  onUncompleteStep: (stepId: string) => void;
  onReschedule?: (date: Date) => void;
}

function TaskCard({ task, isActive, showPlantingBadge = true, onSelect, onCompleteStep, onUncompleteStep, onReschedule }: TaskCardProps) {
  const layer = FOOD_FOREST_LAYERS.find(l => l.id === task.layerId);
  const group = getOrderGroup(task.establishmentOrder);
  const pct = progressPercent(task);
  const isDone = task.status === 'completed';

  const phases = ['preparation', 'planting-day', 'first-30-days', 'year-one'] as const;
  const stepsByPhase = phases.map(phase => ({
    phase,
    steps: task.steps.filter(s => s.phase === phase),
  })).filter(g => g.steps.length > 0);

  return (
    <div
      className={`task-card ${isActive ? 'task-card--active' : ''} ${isDone ? 'task-card--done' : ''}`}
      style={{ '--layer-color': layer?.color ?? '#059669' } as React.CSSProperties}
    >
      <div className="task-card-header" onClick={onSelect} role="button" tabIndex={0}>
        <div className="task-card-left">
          <div className="task-layer-dot" style={{ background: layer?.color }} />
          <div className="task-card-info">
            <div className="task-card-name">{task.plantName}</div>
            <div className="task-card-meta">
              {showPlantingBadge && (
                <span className="task-order-badge" style={{ background: group.color }}>{group.label}</span>
              )}
              <span className="task-window" title={task.bestPlantingWindow}>🗓 {formatDate(effectiveDate(task))}</span>
              {onReschedule && (
                <input
                  type="date"
                  value={dateInputValue(effectiveDate(task))}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                    el.showPicker?.();
                  }}
                  onChange={(e) => {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    if (y && m && d) onReschedule(new Date(y, m - 1, d));
                  }}
                  className="task-date-input"
                  style={{ marginLeft: 8, fontSize: 13, border: '1px solid #94a3b8', borderRadius: 8, padding: '4px 8px', background: '#fff', cursor: 'pointer', color: '#0f172a' }}
                  title="Change planting date"
                />
              )}
            </div>
          </div>
        </div>
        <div className="task-card-right">
          {isDone ? (
            <CheckCircle2 size={20} color="#059669" />
          ) : (
            <>
              <div className="task-progress-ring">
                <svg width="36" height="36" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke={layer?.color ?? '#059669'} strokeWidth="3"
                    strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <span className="task-progress-pct">{pct}%</span>
              </div>
              {isActive ? <ChevronDown size={16} color="#64748b" /> : <ChevronRight size={16} color="#64748b" />}
            </>
          )}
        </div>
      </div>

      {isActive && <div className="task-guild-role">{task.guildRole}</div>}

      {isActive && !isDone && (
        <div className="task-steps">
          {stepsByPhase.map(({ phase, steps }) => (
            <div key={phase} className="task-phase-group">
              <div className="task-phase-label">{PHASE_LABELS[phase]}</div>
              {steps.map(step => (
                <StepRow
                  key={step.id}
                  step={step}
                  onComplete={() => onCompleteStep(step.id)}
                  onUncomplete={() => onUncompleteStep(step.id)}
                />
              ))}
            </div>
          ))}
          <div className="task-xp-preview">
            🏆 {task.xpEarned} / {task.xpReward} XP earned
          </div>
        </div>
      )}
    </div>
  );
}

function StepRow({ step, onComplete, onUncomplete }: { step: TaskStep; onComplete: () => void; onUncomplete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`step-row ${step.completed ? 'step-row--done' : ''}`}>
      <button className="step-check" onClick={step.completed ? onUncomplete : onComplete} title={step.completed ? 'Mark incomplete' : 'Mark complete'}>
        {step.completed ? <CheckCircle2 size={18} color="#059669" /> : <Circle size={18} color="#334155" />}
      </button>
      <div className="step-content">
        <div className="step-title" onClick={() => setExpanded(e => !e)} role="button" tabIndex={0}>
          {step.title}
          {step.estimatedMinutes && (
            <span className="step-time"><Clock size={11} />{step.estimatedMinutes}min</span>
          )}
        </div>
        {expanded && (
          <div className="step-details">
            <p className="step-description">{step.description}</p>
            {step.tips && step.tips.length > 0 && (
              <ul className="step-tips">
                {step.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Care Item Card (for establishing / recurring tasks) ──────────────────────

function CareItemCard({ item, isActive, onSelect, onComplete, onSnooze }: {
  item: CareItem;
  isActive: boolean;
  onSelect: () => void;
  onComplete: () => void;
  onSnooze: (days: number) => void;
}) {
  const layer = FOOD_FOREST_LAYERS.find(l => l.id === item.layerId);
  const now = new Date();
  const isOverdue = item.nextDueDate < now && item.nextDueDate.toDateString() !== now.toDateString();
  const isDueToday = item.nextDueDate.toDateString() === now.toDateString();
  const dueLabel = formatDueDate(item.nextDueDate);

  return (
    <div className={`care-card ${isOverdue ? 'care-card--overdue' : ''} ${isDueToday ? 'care-card--today' : ''}`}>
      <div className="care-card-header" onClick={onSelect} role="button" tabIndex={0}>
        <div className="care-card-left">
          <div className="task-layer-dot" style={{ background: layer?.color }} />
          <div className="care-card-info">
            <div className="care-plant-name">{item.plantName}</div>
            <div className="care-task-title">{item.title}</div>
          </div>
        </div>
        <div className="care-card-right">
          {isOverdue && <span className="care-badge care-badge--overdue">⚠ {dueLabel}</span>}
          {isDueToday && <span className="care-badge care-badge--today">Due today</span>}
          {!isOverdue && !isDueToday && <span className="care-badge">{dueLabel}</span>}
          <button
            className="step-check"
            onClick={e => { e.stopPropagation(); onComplete(); }}
            title="Mark done (resets timer)"
          >
            <Circle size={20} color={isOverdue ? '#ef4444' : isDueToday ? '#f59e0b' : '#334155'} />
          </button>
          {isActive ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
        </div>
      </div>

      {isActive && (
        <div className="care-details">
          <p className="step-description">{item.description}</p>
          {item.tips.length > 0 && (
            <ul className="step-tips">
              {item.tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          )}
          <div className="care-meta">
            <span><Clock size={12} /> {item.estimatedMinutes} min</span>
            <span>Every {item.intervalDays} days</span>
            <span>+{item.xpPerCompletion} XP each</span>
            {item.completionCount > 0 && <span>✓ done {item.completionCount}×</span>}
          </div>
          <div className="care-snooze">
            <span className="care-snooze-label">Reschedule:</span>
            {[1, 3, 7].map(d => (
              <button
                key={d}
                className="care-snooze-btn"
                onClick={e => { e.stopPropagation(); onSnooze(d); }}
              >
                +{d}d
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main PlanningScreen ──────────────────────────────────────────────────────

interface PlanningScreenProps {
  projectId: string;
  userId?: string;
  projectName?: string;
  address?: string;
  mapCenter: { lat: number; lng: number };
  boundaryPoints: { lat: number; lng: number }[];
  shapes: Shape[];
  tasks: PlantingTask[];
  careItems: CareItem[];
  photoReminders?: PhotoReminder[];
  onCompleteStep: (taskId: string, stepId: string) => Promise<void>;
  onUncompleteStep: (taskId: string, stepId: string) => Promise<void>;
  onCompleteCareItem: (itemId: string) => Promise<void>;
  onSnoozeCareItem: (itemId: string, days: number) => Promise<void>;
  onCompletePhotoReminder?: (reminderId: string) => Promise<void>;
  onSnoozePhotoReminder?: (reminderId: string, days: number) => Promise<void>;
  onRescheduleTask?: (taskId: string, date: Date) => void;
  onClose: () => void;
}

export function PlanningScreen({
  projectId,
  userId,
  projectName = 'My Project',
  address = 'Unknown location',
  mapCenter,
  boundaryPoints,
  shapes,
  tasks,
  careItems,
  photoReminders = [],
  onCompleteStep,
  onUncompleteStep,
  onCompleteCareItem,
  onSnoozeCareItem,
  onCompletePhotoReminder,
  onSnoozePhotoReminder,
  onRescheduleTask,
  onClose,
}: PlanningScreenProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeCareId, setActiveCareId] = useState<string | null>(null);
  const [highlightShapeId, setHighlightShapeId] = useState<string | null>(null);
  const [view, setView] = useState<'tasks' | 'calendar' | 'report' | 'photos' | 'gallery'>('tasks');
  const [sortMode, setSortMode] = useState<'date' | 'order' | 'layer'>('date');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const shapeStatusMap = new Map(shapes.map(s => [s.id, s.status ?? 'planned']));
  const liveShapeIds = new Set(shapes.map(s => s.id));

  // "To Plant" — planned shapes with planting tasks. Only tasks whose plant is
  // still on the map (drop orphaned tasks left behind by deleted plants).
  const toPlantTasks = tasks.filter(t =>
    liveShapeIds.has(t.shapeId) && (shapeStatusMap.get(t.shapeId) ?? 'planned') === 'planned'
  );

  // "Caring For" — care items for establishing shapes still on the map, by urgency
  const caringItems = careItems
    .filter(c => liveShapeIds.has(c.shapeId) && shapeStatusMap.get(c.shapeId) === 'establishing')
    .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());

  // Stats — XP is cumulative across ALL of this map's plants (completed planting
  // tasks count even after a plant advances to establishing/established).
  const totalPlantSteps = toPlantTasks.reduce((n, t) => n + t.steps.length, 0);
  const donePlantSteps  = toPlantTasks.reduce((n, t) => n + t.steps.filter(s => s.completed).length, 0);
  const taskXp = tasks.filter(t => liveShapeIds.has(t.shapeId)).reduce((n, t) => n + (t.xpEarned || 0), 0);
  const careXp = careItems.filter(c => liveShapeIds.has(c.shapeId)).reduce((n, c) => n + (c.totalXpEarned || 0), 0);
  const totalXp = taskXp + careXp;

  const visibleToPlant = toPlantTasks.filter(t => withinFilter(effectiveDate(t), timeFilter));
  const visibleCaring = caringItems.filter(c => withinFilter(c.nextDueDate, timeFilter));

  const plantGroups: { label: string; color?: string; tasks: PlantingTask[] }[] = (() => {
    if (sortMode === 'order') {
      return ORDER_GROUPS.map(g => ({
        label: g.label, color: g.color,
        tasks: visibleToPlant.filter(t => t.establishmentOrder >= g.min && t.establishmentOrder <= g.max),
      })).filter(g => g.tasks.length > 0);
    }
    if (sortMode === 'layer') {
      return FOOD_FOREST_LAYERS.map(l => ({
        label: l.name, color: l.color,
        tasks: visibleToPlant.filter(t => t.layerId === l.id),
      })).filter(g => g.tasks.length > 0);
    }
    // By date: chronological, grouped by month
    const sorted = [...visibleToPlant].sort((a, b) => effectiveDate(a).getTime() - effectiveDate(b).getTime());
    const byMonth = new Map<string, { date: Date; tasks: PlantingTask[] }>();
    for (const t of sorted) {
      const d = effectiveDate(t);
      const key = monthKey(d);
      if (!byMonth.has(key)) byMonth.set(key, { date: new Date(d.getFullYear(), d.getMonth(), 1), tasks: [] });
      byMonth.get(key)!.tasks.push(t);
    }
    return [...byMonth.entries()]
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
      .map(([label, v]) => ({ label, tasks: v.tasks }));
  })();

  function handleSelectTask(task: PlantingTask) {
    const next = activeTaskId === task.id ? null : task.id;
    setActiveTaskId(next);
    setActiveCareId(null);
    setHighlightShapeId(next ? task.shapeId : null);
  }

  function handleSelectCare(item: CareItem) {
    const next = activeCareId === item.id ? null : item.id;
    setActiveCareId(next);
    setActiveTaskId(null);
    setHighlightShapeId(next ? item.shapeId : null);
  }

  const hasContent = toPlantTasks.length > 0 || caringItems.length > 0;

  return (
    <div className="planning-overlay">
      {/* Header */}
      <div className="planning-header">
        <button className="planning-back" onClick={onClose}>
          <ArrowLeft size={16} />
          Back to Map
        </button>
        <div className="planning-header-center">
          <h2>Grow Your Forest</h2>
          {totalPlantSteps > 0 && (
            <span className="planning-progress-label">
              {donePlantSteps}/{totalPlantSteps} planting steps complete
            </span>
          )}
        </div>
        <div className="planning-xp">
          <LevelBar totalXp={totalXp} />
        </div>
      </div>

      {/* Body */}
      <div className="planning-body">
        {/* Left panel */}
        <div className="planning-tasks">
          {/* Tabs */}
          <div className="planning-tabs">
            <button
              className={`planning-tab ${view === 'tasks' ? 'planning-tab--active' : ''}`}
              onClick={() => setView('tasks')}
            >
              <ListTodo size={14} /> Tasks
            </button>
            <button
              className={`planning-tab ${view === 'calendar' ? 'planning-tab--active' : ''}`}
              onClick={() => setView('calendar')}
            >
              <CalendarDays size={14} /> Calendar
            </button>
            <button
              className={`planning-tab ${view === 'report' ? 'planning-tab--active' : ''}`}
              onClick={() => setView('report')}
            >
              <FileText size={14} /> Report
            </button>
            {photoReminders.length > 0 && (
              <button
                className={`planning-tab ${view === 'photos' ? 'planning-tab--active' : ''}`}
                onClick={() => setView('photos')}
              >
                <Camera size={14} /> Reminders
              </button>
            )}
            {userId && (
              <button
                className={`planning-tab ${view === 'gallery' ? 'planning-tab--active' : ''}`}
                onClick={() => setView('gallery')}
              >
                <Image size={14} /> Gallery
              </button>
            )}
          </div>

          {/* Tasks view */}
          {view === 'tasks' && (
            <>
              <div style={{ display: 'flex', gap: 6, padding: '0 0 12px', flexWrap: 'wrap' }}>
                {(['day', 'week', 'month', 'all'] as TimeFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    style={{
                      fontSize: 12, padding: '4px 12px', borderRadius: 999, cursor: 'pointer',
                      border: '1px solid ' + (timeFilter === f ? '#059669' : '#334155'),
                      background: timeFilter === f ? '#059669' : 'transparent',
                      color: timeFilter === f ? '#fff' : '#94a3b8',
                    }}
                  >
                    {f === 'day' ? 'Today' : f === 'week' ? 'This week' : f === 'month' ? 'This month' : 'All'}
                  </button>
                ))}
              </div>

              {hasContent && plantGroups.length === 0 && visibleCaring.length === 0 && (
                <div className="planning-empty"><p>Nothing due in this range.</p></div>
              )}

              {!hasContent && (
                <div className="planning-empty">
                  <p>No tasks yet.</p>
                  <p>Place plants as <strong>Planned</strong> on the map and tasks will appear here automatically.</p>
                </div>
              )}

              {/* To Plant */}
              {plantGroups.length > 0 && (
                <div className="planning-section">
                  <div className="planning-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span>🌱 To Plant</span>
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      {(['date', 'order', 'layer'] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => setSortMode(m)}
                          style={{
                            fontSize: 12, padding: '3px 9px', borderRadius: 999, cursor: 'pointer',
                            border: '1px solid ' + (sortMode === m ? '#059669' : '#cbd5e1'),
                            background: sortMode === m ? '#059669' : '#fff',
                            color: sortMode === m ? '#fff' : '#475569',
                          }}
                        >
                          {m === 'date' ? 'By date' : m === 'order' ? 'By order' : 'By layer'}
                        </button>
                      ))}
                    </span>
                  </div>
                  {plantGroups.map(group => (
                    <div key={group.label} className="task-group">
                      <div className="task-group-header" style={{ borderColor: group.color ?? '#059669' }}>
                        <span className="task-group-dot" style={{ background: group.color ?? '#059669' }} />
                        {group.label}
                        <span className="task-group-count">{group.tasks.length} plant{group.tasks.length !== 1 ? 's' : ''}</span>
                      </div>
                      {group.tasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          isActive={activeTaskId === task.id}
                          showPlantingBadge={sortMode !== 'order'}
                          onSelect={() => handleSelectTask(task)}
                          onCompleteStep={stepId => onCompleteStep(task.id, stepId)}
                          onUncompleteStep={stepId => onUncompleteStep(task.id, stepId)}
                          onReschedule={onRescheduleTask ? (date) => onRescheduleTask(task.id, date) : undefined}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Caring For */}
              {visibleCaring.length > 0 && (
                <div className="planning-section">
                  <div className="planning-section-header">💧 Caring For</div>
                  {visibleCaring.map(item => (
                    <CareItemCard
                      key={item.id}
                      item={item}
                      isActive={activeCareId === item.id}
                      onSelect={() => handleSelectCare(item)}
                      onComplete={() => onCompleteCareItem(item.id)}
                      onSnooze={days => onSnoozeCareItem(item.id, days)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Calendar view */}
          {view === 'calendar' && (
            <CalendarView tasks={toPlantTasks} careItems={caringItems} />
          )}

          {/* Report view */}
          {view === 'report' && (
            <DesignReport
              projectName={projectName}
              address={address}
              shapes={shapes}
              tasks={toPlantTasks}
              careItems={caringItems}
            />
          )}

          {/* Photo session view */}
          {view === 'photos' && (
            <PhotoSessionPanel
              photoReminders={photoReminders}
              shapes={shapes}
              onStartSession={() => {
                /* TODO: activate photo mode in map or open camera */
              }}
              onCompletePhoto={async (reminderId) => {
                if (onCompletePhotoReminder) {
                  await onCompletePhotoReminder(reminderId);
                }
              }}
              onSnooze={async (reminderId, days) => {
                if (onSnoozePhotoReminder) {
                  await onSnoozePhotoReminder(reminderId, days);
                }
              }}
            />
          )}

          {/* Photo gallery view */}
          {view === 'gallery' && userId && (
            <PhotoGallery projectId={projectId} userId={userId} />
          )}
        </div>

        {/* Read-only map */}
        <div className="planning-map">
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={20}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
            doubleClickZoom={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
              maxZoom={22}
            />

            {boundaryPoints.length > 2 && (
              <LeafletPolygon
                positions={boundaryPoints.map(p => [p.lat, p.lng] as [number, number])}
                pathOptions={{ fillColor: '#f59e0b', fillOpacity: 0.05, color: '#f59e0b', weight: 2 }}
              />
            )}

            {shapes.map(shape => {
              const layer = FOOD_FOREST_LAYERS.find(l => l.id === shape.layerId);
              if (!layer || shape.type !== 'circle' || !shape.center) return null;
              const isHighlighted = shape.id === highlightShapeId;
              const canopyR = (shape.canopyRadius || 5) * 0.3048;

              return (
                <LeafletCircle
                  key={shape.id}
                  center={[shape.center.lat, shape.center.lng]}
                  radius={canopyR}
                  pathOptions={{
                    fillColor: layer.color,
                    fillOpacity: isHighlighted ? 0.65 : 0.3,
                    color: isHighlighted ? '#fbbf24' : layer.color,
                    weight: isHighlighted ? 3 : 1,
                  }}
                >
                  {shape.plantName && (
                    <Tooltip permanent={isHighlighted} direction="top" offset={[0, -6]}>
                      <strong>{shape.plantName}</strong>
                    </Tooltip>
                  )}
                </LeafletCircle>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
