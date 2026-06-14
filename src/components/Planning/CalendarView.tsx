// src/components/Planning/CalendarView.tsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FOOD_FOREST_LAYERS, PlantingTask, CareItem } from '../../types';
import './CalendarView.css';

const MONTH_MAP: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3,
  may: 4, june: 5, july: 6, august: 7,
  september: 8, october: 9, november: 10, december: 11,
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parsePlantingWindow(str: string): { start: number; end: number } | null {
  const m = str.toLowerCase().match(/(\w+)\s+through\s+(\w+)/);
  if (!m) return null;
  const start = MONTH_MAP[m[1]];
  const end = MONTH_MAP[m[2]];
  if (start === undefined || end === undefined) return null;
  return { start, end };
}

function monthInWindow(month: number, w: { start: number; end: number }): boolean {
  // Handle windows that wrap around the year end (e.g. October through February)
  if (w.start <= w.end) return month >= w.start && month <= w.end;
  return month >= w.start || month <= w.end;
}

interface Props {
  tasks: PlantingTask[];      // planned tasks — for planting windows
  careItems: CareItem[];      // for care item dots
}

export function CalendarView({ tasks, careItems }: Props) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonthYear = today.getFullYear() === year && today.getMonth() === month;

  // Build care-items-by-day map for this month
  const careByDay = new Map<number, CareItem[]>();
  careItems.forEach(item => {
    const d = item.nextDueDate;
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!careByDay.has(day)) careByDay.set(day, []);
      careByDay.get(day)!.push(item);
    }
  });

  // Planting windows that include this month
  const plantingNow = tasks.filter(t => {
    const w = parsePlantingWindow(t.bestPlantingWindow);
    return w ? monthInWindow(month, w) : false;
  });

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  // Build grid cells: nulls for leading empty, then 1..daysInMonth
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="cal-view">
      {/* Header */}
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}><ChevronLeft size={18} /></button>
        <span className="cal-month-label">{MONTH_NAMES[month]} {year}</span>
        <button className="cal-nav" onClick={nextMonth}><ChevronRight size={18} /></button>
      </div>

      {/* Planting window banner */}
      {plantingNow.length > 0 && (
        <div className="cal-planting-banner">
          <span className="cal-plant-icon">🌱</span>
          <span>
            <strong>Good time to plant: </strong>
            {plantingNow.map(t => t.plantName).join(', ')}
          </span>
        </div>
      )}

      {/* Day-of-week headers */}
      <div className="cal-dow-row">
        {DOW.map(d => <div key={d} className="cal-dow">{d}</div>)}
      </div>

      {/* Day grid */}
      <div className="cal-grid">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="cal-cell cal-cell--empty" />;
          const isToday = isCurrentMonthYear && day === today.getDate();
          const items = careByDay.get(day) ?? [];
          return (
            <div key={day} className={`cal-cell ${isToday ? 'cal-cell--today' : ''}`}>
              <span className="cal-day-num">{day}</span>
              {items.length > 0 && (
                <div className="cal-dots">
                  {items.slice(0, 4).map(item => {
                    const layer = FOOD_FOREST_LAYERS.find(l => l.id === item.layerId);
                    return (
                      <div
                        key={item.id}
                        className="cal-dot"
                        style={{ background: layer?.color ?? '#059669' }}
                        title={`${item.plantName}: ${item.title}`}
                      />
                    );
                  })}
                  {items.length > 4 && <div className="cal-dot-more">+{items.length - 4}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {careItems.length > 0 && (
        <div className="cal-legend">
          {Array.from(new Set(careItems.map(c => c.layerId))).map(layerId => {
            const layer = FOOD_FOREST_LAYERS.find(l => l.id === layerId);
            if (!layer) return null;
            return (
              <div key={layerId} className="cal-legend-item">
                <div className="cal-dot" style={{ background: layer.color }} />
                <span>{layer.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {careItems.length === 0 && plantingNow.length === 0 && (
        <div className="cal-empty">
          <p>No care tasks scheduled yet.</p>
          <p>Complete all planting steps for a plant to unlock its recurring care schedule.</p>
        </div>
      )}
    </div>
  );
}
