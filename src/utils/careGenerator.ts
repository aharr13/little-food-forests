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
  const template = templates.find(t => matchesTemplate(t, shape.plantName!));
  if (!template?.careSchedule?.length) return [];

  const now = new Date();
  return template.careSchedule.map((cs, i) => {
    const nextDueDate = new Date(now);
    nextDueDate.setDate(nextDueDate.getDate() + cs.intervalDays);

    return {
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
    };
  });
}
