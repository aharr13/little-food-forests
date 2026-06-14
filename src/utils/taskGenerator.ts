// src/utils/taskGenerator.ts
import { Shape, PlantingTask, TaskStep } from '../types';
import type { UserProfile } from '../hooks/useUserProfile';
import plantTasksRaw from '../../data/plant-tasks.json';

interface TaskTemplate {
  commonName: string;
  aliases?: string[];
  guildRole: string;
  bestPlantingWindow: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  xpReward: number;
  tags: string[];
  steps: {
    phase: string;
    title: string;
    description: string;
    tips?: string[];
    estimatedMinutes?: number;
  }[];
}

const templates: TaskTemplate[] = plantTasksRaw as TaskTemplate[];

// Establishment order by layer — lower = plant earlier
const LAYER_ORDER: Record<string, number> = {
  infrastructure: 1,
  canopy:         2,
  understory:     3,
  rhizosphere:    4,
  shrub:          4,
  vine:           5,
  herbaceous:     6,
  groundcover:    7,
};

// Known nitrogen-fixers get a slight boost within their layer
const NITROGEN_FIXERS = ['leucaena', 'cowpea', 'mesquite', 'acacia', 'redbud', 'black locust'];

function getEstablishmentOrder(shape: Shape): number {
  const base = LAYER_ORDER[shape.layerId] ?? 5;
  const isNFixer = NITROGEN_FIXERS.some(n => shape.plantName?.toLowerCase().includes(n));
  return isNFixer ? base - 0.5 : base;
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

// Enrich template description with user profile details
function personalizeDescription(description: string, profile: UserProfile): string {
  let result = description;
  if (profile.soilType) {
    result = result.replace(
      'native soil',
      `your ${profile.soilType.toLowerCase()} native soil`,
    );
  }
  if (profile.waterSource && profile.waterSource.toLowerCase().includes('drip')) {
    result = result.replace(
      'Water slowly',
      'Your drip system can handle this — set it to water slowly',
    );
  }
  return result;
}

export function generateTaskForShape(
  shape: Shape,
  projectId: string,
  profile: UserProfile = {},
  userId: string = '',
): PlantingTask | null {
  if (!shape.plantName) return null;

  const template = templates.find(t => matchesTemplate(t, shape.plantName!));

  const now = new Date();
  const steps: TaskStep[] = (template?.steps ?? buildGenericSteps(shape)).map((s, i) => ({
    id:                 `step_${shape.id}_${i}`,
    phase:              s.phase as TaskStep['phase'],
    order:              i,
    title:              s.title,
    description:        personalizeDescription(s.description, profile),
    tips:               s.tips,
    estimatedMinutes:   s.estimatedMinutes,
    completed:          false,
  }));

  const task: PlantingTask = {
    id:                   `task_${shape.id}`,
    projectId,
    userId,
    shapeId:              shape.id,
    plantName:            shape.plantName,
    plantScientificName:  shape.plantScientificName,
    layerId:              shape.layerId,
    guildRole:            template?.guildRole ?? `${shape.layerId} layer plant`,
    bestPlantingWindow:   template?.bestPlantingWindow ?? 'Spring or Fall',
    establishmentOrder:   getEstablishmentOrder(shape),
    steps,
    status:               'pending',
    xpReward:             template?.xpReward ?? 75,
    difficulty:           template?.difficulty ?? 2,
    tags:                 template?.tags ?? [shape.layerId],
    xpEarned:             0,
    createdAt:            now,
    updatedAt:            now,
  };

  return task;
}

// Fallback generic steps for plants without a specific template
function buildGenericSteps(shape: Shape) {
  return [
    {
      phase: 'preparation',
      title: 'Choose and prepare your planting site',
      description: `Select a spot appropriate for a ${shape.layerId} layer plant. Clear any grass or weeds in a 2–3ft circle. Consider sun exposure, proximity to other plants, and drainage.`,
      tips: ['Most Texas food forest plants prefer well-drained soil', 'Morning sun with afternoon shade works for most species'],
      estimatedMinutes: 20,
    },
    {
      phase: 'preparation',
      title: 'Dig the planting hole',
      description: 'Dig a hole twice the width of the root ball and the same depth. Loosen the sides of the hole. For native plants, use unamended backfill soil. For fruit trees and vegetables, mix in 1/3 compost.',
      tips: [],
      estimatedMinutes: 30,
    },
    {
      phase: 'planting-day',
      title: 'Plant at correct depth',
      description: 'Set the plant so the root flare or top of the root ball is at or slightly above ground level. Backfill in layers, tamping gently to eliminate air pockets. Water thoroughly after planting.',
      tips: ['Planting too deep is the most common planting mistake'],
      estimatedMinutes: 30,
    },
    {
      phase: 'planting-day',
      title: 'Mulch the planting area',
      description: 'Apply 3–4 inches of wood chip mulch in a ring around the plant, keeping 6 inches clear of the trunk or stems. Mulch is one of the highest-value actions you can take for plant health.',
      tips: ['Never pile mulch against the trunk'],
      estimatedMinutes: 15,
    },
    {
      phase: 'first-30-days',
      title: 'First-month watering schedule',
      description: 'Water deeply every 3–4 days for the first month. Then reduce to weekly through the first summer. Always water at the drip line, not the stem.',
      tips: ['Check soil moisture 3 inches down — water when dry, wait when moist'],
      estimatedMinutes: 10,
    },
    {
      phase: 'year-one',
      title: 'Year-one establishment',
      description: 'Continue weekly watering through the first summer. Watch for signs of stress (yellowing, wilting, brown edges) and adjust watering accordingly. Avoid fertilizing until the plant shows strong new growth.',
      tips: [],
      estimatedMinutes: 10,
    },
  ];
}
