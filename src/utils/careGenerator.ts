// src/utils/careGenerator.ts
import { Shape, CareItem, CarePhase } from '../types';
import plantTasksRaw from '../../data/plant-tasks.json';

interface CareScheduleEntry {
  phase: string;
  title: string;
  description: string;
  tips: string[];
  intervalDays: number;
  estimatedMinutes: number;
  xpPerCompletion: number;
}

interface TaskTemplate {
  commonName: string;
  aliases?: string[];
  careSchedule?: CareScheduleEntry[];
}

const templates: TaskTemplate[] = plantTasksRaw as TaskTemplate[];

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];

// Seasonal care (e.g. "February frost check", "late winter prune") should land
// in the right month, not now+interval. Falls back to now+interval if no
// season/month is named.
function nextCareDate(text: string, fallbackIntervalDays: number, from: Date): Date {
  const t = text.toLowerCase();
  let month = -1;
  for (let i = 0; i < 12; i++) if (t.includes(MONTHS[i])) { month = i; break; }
  if (month < 0) {
    if (/late winter|frost/.test(t)) month = 1;       // February
    else if (/early spring/.test(t)) month = 2;        // March
    else if (/spring/.test(t)) month = 3;              // April
    else if (/early summer/.test(t)) month = 4;        // May
    else if (/summer/.test(t)) month = 6;              // July
    else if (/early fall|early autumn/.test(t)) month = 8;
    else if (/fall|autumn/.test(t)) month = 9;         // October
    else if (/winter|dormant/.test(t)) month = 0;      // January
  }
  if (month < 0) {
    const d = new Date(from);
    d.setDate(d.getDate() + fallbackIntervalDays);
    return d;
  }
  const year = from.getMonth() > month ? from.getFullYear() + 1 : from.getFullYear();
  return new Date(year, month, 1);
}

function matchesTemplate(t: TaskTemplate, plantName: string): boolean {
  const name = plantName.toLowerCase();
  const cn = t.commonName.toLowerCase();
  if (cn === name || name.includes(cn) || cn.includes(name)) return true;
  return (t.aliases ?? []).some(a => {
    const al = a.toLowerCase();
    return al === name || name.includes(al) || al.includes(name);
  });
}

export function generateCareItemsForShape(shape: Shape, projectId: string, userId = ''): CareItem[] {
  if (!shape.plantName) return [];
  const now = new Date();
  const items: CareItem[] = [];

  // Every newly-planted plant gets a DAILY watering task for the first 30 days.
  // After 30 days it automatically steps down to weekly (see useCareItems).
  const waterDue = new Date(now);
  waterDue.setDate(waterDue.getDate() + 1);
  items.push({
    id: `care_${shape.id}_watering`,
    projectId,
    userId,
    shapeId: shape.id,
    plantName: shape.plantName!,
    layerId: shape.layerId,
    title: `Water ${shape.plantName}`,
    description: 'Water deeply every day for the first 30 days while roots establish. After that it steps down to about weekly through the first year.',
    tips: ['Water at the drip line, not against the stem', 'Check soil ~3 inches down — water when dry, skip when still moist'],
    estimatedMinutes: 5,
    intervalDays: 1,
    phase: 'first-30-days',
    xpPerCompletion: 5,
    totalXpEarned: 0,
    completionCount: 0,
    nextDueDate: waterDue,
    createdAt: now,
  });

  // Plus any NON-watering recurring care from the template (mulch, prune, feed…).
  const template = templates.find(t => matchesTemplate(t, shape.plantName!));
  (template?.careSchedule ?? [])
    .filter(cs => !/water/i.test(cs.title) && !/water/i.test(cs.description))
    .forEach((cs, i) => {
      const nextDueDate = nextCareDate(`${cs.title} ${cs.description}`, cs.intervalDays, now);
      items.push({
        id: `care_${shape.id}_${i}`,
        projectId,
        userId,
        shapeId: shape.id,
        plantName: shape.plantName!,
        layerId: shape.layerId,
        title: cs.title,
        description: cs.description,
        tips: cs.tips ?? [],
        estimatedMinutes: cs.estimatedMinutes,
        intervalDays: cs.intervalDays,
        phase: cs.phase as CarePhase,
        xpPerCompletion: cs.xpPerCompletion,
        totalXpEarned: 0,
        completionCount: 0,
        nextDueDate,
        createdAt: now,
      });
    });

  return items;
}
