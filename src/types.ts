// src/components/Canvas/types.ts
import { TreeDeciduous, Leaf, Sprout, Flower, Grape, Mountain, Grid } from 'lucide-react';

export const FOOD_FOREST_LAYERS = [
  { 
    id: 'canopy', 
    name: 'Canopy', 
    color: '#28594C', 
    icon: TreeDeciduous, 
    description: 'Tallest trees (20-40ft+) that provide shade and structure for your food forest.',
    defaultTool: 'circle' as const
  },
  { 
    id: 'understory', 
    name: 'Understory', 
    color: '#2A7A3C', 
    icon: TreeDeciduous, 
    description: 'Smaller trees (10-20ft) that thrive in partial shade beneath the canopy.',
    defaultTool: 'circle' as const
  },
  { 
    id: 'shrub', 
    name: 'Shrub', 
    color: '#78C443', 
    icon: Leaf, 
    description: 'Woody bushes (3-10ft) that provide berries, habitat, and erosion control.',
    defaultTool: 'circle' as const
  },
  { 
    id: 'herbaceous', 
    name: 'Herbaceous', 
    color: '#fbbf24', 
    icon: Flower, 
    description: 'Perennial herbs and vegetables that provide food, medicine, and pest management.',
    defaultTool: 'circle' as const
  },
  { 
    id: 'groundcover', 
    name: 'Groundcover', 
    color: '#B7EBD1', 
    icon: Sprout, 
    description: 'Low spreading plants that act as living mulch and suppress weeds.',
    defaultTool: 'polygon' as const
  },
  { 
    id: 'rhizosphere', 
    name: 'Rhizosphere', 
    color: '#F54927', 
    icon: Mountain, 
    description: 'Root crops and deep-rooted plants that mine nutrients and build soil.',
    defaultTool: 'circle' as const
  },
  { 
    id: 'vine', 
    name: 'Vine', 
    color: '#AE92C9', 
    icon: Grape, 
    description: 'Climbing plants that maximize vertical space for food production.',
    defaultTool: 'line' as const
  },
  { 
    id: 'infrastructure', 
    name: 'Infrastructure', 
    color: '#000000', 
    icon: Grid, 
    description: 'Paths, fences, structures, and water features that support your design.',
    defaultTool: 'line' as const
  },
];

export interface Point {
  lat: number;
  lng: number;
}

export type ShapeType = 'circle' | 'line' | 'polygon';
export type DrawingTool = 'select' | 'circle' | 'line' | 'polygon' | 'photoAnchors';

export type PlantStatus = 'planned' | 'establishing' | 'established';

export interface Shape {
  id: string;
  layerId: string;
  type: ShapeType;
  // For circles
  center?: Point;
  radius?: number; // trunk radius in feet
  canopyRadius?: number; // canopy radius in feet (for trees)
  // For lines and polygons
  points?: Point[];
  // Plant assignment
  plantId?: string;
  plantName?: string;
  plantScientificName?: string;
  // Cultivation status
  status?: PlantStatus;
  // Photo anchor fields
  photoAnchor?: boolean;        // marks this shape as a photo anchor point
  targetPoint?: Point;          // where camera should aim
  anchorLabel?: string;         // optional custom name (else "Position N")
}

export interface ProjectSnapshot {
  date: Date;
  imageDataUrl: string;
  plantCount: number;
}

export interface LayerVisibility {
  [layerId: string]: boolean;
}

// Groundcover species data
export interface GroundcoverSpecies {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  sunRequirements: 'full-sun' | 'partial-shade' | 'full-shade' | 'any';
  spreadRate: 'slow' | 'moderate' | 'fast';
  edible: boolean;
}

export const GROUNDCOVER_SPECIES: GroundcoverSpecies[] = [
  {
    id: 'white-clover',
    name: 'White Clover',
    scientificName: 'Trifolium repens',
    description: 'Nitrogen-fixing groundcover that attracts pollinators. Edible flowers.',
    sunRequirements: 'any',
    spreadRate: 'fast',
    edible: true,
  },
  {
    id: 'strawberry',
    name: 'Wild Strawberry',
    scientificName: 'Fragaria vesca',
    description: 'Produces small sweet berries. Spreads by runners.',
    sunRequirements: 'partial-shade',
    spreadRate: 'moderate',
    edible: true,
  },
  {
    id: 'creeping-thyme',
    name: 'Creeping Thyme',
    scientificName: 'Thymus serpyllum',
    description: 'Aromatic herb that handles foot traffic. Drought tolerant.',
    sunRequirements: 'full-sun',
    spreadRate: 'slow',
    edible: true,
  },
  {
    id: 'violet',
    name: 'Sweet Violet',
    scientificName: 'Viola odorata',
    description: 'Shade-loving with edible flowers. Self-seeds readily.',
    sunRequirements: 'partial-shade',
    spreadRate: 'moderate',
    edible: true,
  },
  {
    id: 'mint',
    name: 'Corsican Mint',
    scientificName: 'Mentha requienii',
    description: 'Very low-growing mint. Strong fragrance when stepped on.',
    sunRequirements: 'partial-shade',
    spreadRate: 'fast',
    edible: true,
  },
  {
    id: 'ajuga',
    name: 'Bugleweed',
    scientificName: 'Ajuga reptans',
    description: 'Purple-flowered groundcover. Tolerates shade and poor soil.',
    sunRequirements: 'partial-shade',
    spreadRate: 'fast',
    edible: false,
  },
  {
    id: 'creeping-jenny',
    name: 'Creeping Jenny',
    scientificName: 'Lysimachia nummularia',
    description: 'Golden foliage variety available. Great for moist areas.',
    sunRequirements: 'any',
    spreadRate: 'fast',
    edible: false,
  },
  {
    id: 'oregano',
    name: 'Creeping Oregano',
    scientificName: 'Origanum vulgare',
    description: 'Culinary herb that spreads as groundcover. Drought tolerant.',
    sunRequirements: 'full-sun',
    spreadRate: 'moderate',
    edible: true,
  },
  {
    id: 'chamomile',
    name: 'Roman Chamomile',
    scientificName: 'Chamaemelum nobile',
    description: 'Apple-scented groundcover. Used for herbal tea.',
    sunRequirements: 'full-sun',
    spreadRate: 'slow',
    edible: true,
  },
  {
    id: 'sedum',
    name: 'Stonecrop',
    scientificName: 'Sedum spp.',
    description: 'Succulent groundcover. Extremely drought tolerant.',
    sunRequirements: 'full-sun',
    spreadRate: 'slow',
    edible: false,
  },
];

// Water & Topography feature types
export type WaterFeatureType = 'high-point' | 'low-point' | 'water-pool';

export interface WaterFeature {
  id: string;
  type: WaterFeatureType;
  position: Point;
  notes?: string;
}

export const WATER_FEATURE_TYPES: {
  id: WaterFeatureType;
  name: string;
  description: string;
  color: string;
  icon: string; // emoji for simplicity
}[] = [
  {
    id: 'high-point',
    name: 'High Point',
    description: 'Highest elevation on your property. Water flows away from here.',
    color: '#f97316', // orange
    icon: '⬆️',
  },
  {
    id: 'low-point',
    name: 'Low Point',
    description: 'Lowest elevation where water naturally collects.',
    color: '#3b82f6', // blue
    icon: '⬇️',
  },
  {
    id: 'water-pool',
    name: 'Water Pooling',
    description: 'Areas where water pools or stays wet after rain.',
    color: '#06b6d4', // cyan
    icon: '💧',
  },
];

// Wiki Article types
export type WikiCategory =
  | 'getting-started'
  | 'design-principles'
  | 'plant-science'
  | 'techniques'
  | 'maintenance'
  | 'motivation';

export interface LearningActivity {
  title: string;
  steps: string[];
}

export interface WikiArticle {
  id: string;
  title: string;
  slug: string; // URL-friendly identifier
  category: WikiCategory;
  summary: string; // Short description for listings
  content: string; // Markdown content
  imageUrl?: string; // Hero/header image URL
  learningActivity?: LearningActivity;
  reflectiveQuestion?: string;
  order?: number; // Display order within category
  relatedArticles?: string[]; // IDs of related articles
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
}

export const WIKI_CATEGORIES: {
  id: WikiCategory;
  name: string;
  description: string;
  icon: string;
}[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Introduction to food forests and permaculture basics',
    icon: '🌱',
  },
  {
    id: 'design-principles',
    name: 'Design Principles',
    description: 'Layers, guilds, succession, and zones',
    icon: '📐',
  },
  {
    id: 'plant-science',
    name: 'Plant Science',
    description: 'Nitrogen fixers, dynamic accumulators, companion planting',
    icon: '🔬',
  },
  {
    id: 'techniques',
    name: 'Techniques',
    description: 'Sheet mulching, chop-and-drop, swales and berms',
    icon: '🛠️',
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'Seasonal care, pest management, harvesting',
    icon: '🗓️',
  },
  {
    id: 'motivation',
    name: 'Mind & Motivation',
    description: 'Psychology of gardening, habit formation, and finding meaning',
    icon: '🧠',
  },
];

// Plant Database types
export type GuildFunction =
  | 'nitrogen-fixer'
  | 'dynamic-accumulator'
  | 'insectary'
  | 'mulch-producer'
  | 'pest-confuser';

export type SunRequirement = 'full-sun' | 'partial-shade' | 'full-shade';
export type WaterRequirement = 'low' | 'moderate' | 'high';

export interface Plant {
  id: string;
  commonName: string;
  scientificName: string;
  description: string;
  layerTypes: string[];
  guildFunctions: GuildFunction[];
  hardinessZones: string[];
  sunRequirement: SunRequirement;
  waterRequirement: WaterRequirement;
  matureHeight?: number;
  matureSpread?: number;
  edible?: boolean;
  nativeToTexas?: boolean;
  regions?: string[]; // e.g. ["central-texas", "east-texas"]
  toxicityWarning?: string | null; // Warning about toxic parts
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const GUILD_FUNCTIONS: {
  id: GuildFunction;
  name: string;
  description: string;
  icon: string;
}[] = [
  {
    id: 'nitrogen-fixer',
    name: 'Nitrogen Fixer',
    description: 'Captures atmospheric nitrogen and converts it to plant-available form',
    icon: 'N',
  },
  {
    id: 'dynamic-accumulator',
    name: 'Dynamic Accumulator',
    description: 'Deep roots mine nutrients from subsoil',
    icon: '↑',
  },
  {
    id: 'insectary',
    name: 'Insectary',
    description: 'Attracts beneficial insects for pollination and pest control',
    icon: '🐝',
  },
  {
    id: 'mulch-producer',
    name: 'Mulch Producer',
    description: 'Produces biomass for chop-and-drop mulching',
    icon: '🍂',
  },
  {
    id: 'pest-confuser',
    name: 'Pest Confuser',
    description: 'Strong scents that mask or repel pest insects',
    icon: '🌿',
  },
];

// ─── Planting Tasks ────────────────────────────────────────────────────────

export type TaskPhase = 'preparation' | 'planting-day' | 'first-30-days' | 'year-one';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface TaskStep {
  id: string;
  phase: TaskPhase;
  order: number;
  title: string;
  description: string;
  tips?: string[];
  estimatedMinutes?: number;
  completed: boolean;
  completedAt?: Date;
}

export interface PlantingTask {
  id: string;
  projectId: string;
  userId: string;
  shapeId: string;             // links to placed shape on map
  plantName: string;
  plantScientificName?: string;
  layerId: string;
  guildRole: string;           // "Canopy anchor — plant this first"
  bestPlantingWindow: string;  // "October through February"
  scheduledDate?: Date;        // concrete target planting date (auto-set by season, editable)
  establishmentOrder: number;  // 1 = first to plant; used for sorting
  steps: TaskStep[];

  // Status
  status: TaskStatus;
  completedAt?: Date;
  notes?: string;

  // Gamification hooks (displayed later)
  xpReward: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];              // e.g. ['canopy', 'native', 'nitrogen-fixer']
  xpEarned: number;            // increments as steps are checked off

  createdAt: Date;
  updatedAt: Date;
}

// ─── Care items (recurring tasks for establishing plants) ───────────────────

export type CarePhase = 'first-30-days' | 'year-one' | 'ongoing';

export interface CareItem {
  id: string;
  projectId: string;
  userId: string;
  shapeId: string;
  plantName: string;
  layerId: string;
  title: string;
  description: string;
  tips: string[];
  estimatedMinutes: number;
  intervalDays: number;        // how often this task recurs
  phase: CarePhase;
  xpPerCompletion: number;
  totalXpEarned: number;
  completionCount: number;
  lastCompletedAt?: Date;
  nextDueDate: Date;           // lastCompletedAt + intervalDays
  createdAt: Date;
}

// ─── Photo reminders (periodic photo sessions for stop-motion) ────────────

export interface PhotoReminder {
  id: string;
  projectId: string;
  userId: string;
  anchorPointId: string;        // References Shape.id of photo anchor
  intervalDays: number;         // e.g., 30 for monthly
  nextPhotoDate: Date;
  lastPhotoDate?: Date;
  photoCount: number;
  xpPerPhoto: number;
  createdAt: Date;
}

export interface AnchorPointPhoto {
  id: string;
  projectId: string;
  userId: string;
  kind: 'anchor' | 'plant';        // anchor = fixed-position time-lapse; plant = a specific plant
  photoUrl: string;
  storagePath?: string;            // for deleting the underlying Storage file
  capturedAt: Date;
  createdAt: Date;
  notes?: string;
  width?: number;                  // pixel dims (for ghost-overlay aspect + galleries)
  height?: number;

  // Anchor photos (kind === 'anchor')
  anchorPointId: string;           // shape.id of the photo anchor ('' for plant photos)
  anchorPositionLabel?: string;    // "1", "2", "3" — which station this is

  // Plant photos (kind === 'plant') — tagged by BOTH instance and species
  shapeId?: string;                // the specific plant on the map (instance)
  plantName?: string;              // common name (species rollup)
  plantScientificName?: string;
}

// ─── Consultation & AI interaction types ───────────────────────────────────
// Consultation & AI interaction types
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface RejectedPlant {
  commonName: string;
  scientificName: string;
  layer: string;
  reason: string;              // Why Claude originally suggested it
  rejectedAt: Date;            // When it was rejected
  effortLevel: number;
  priority: 'high' | 'medium' | 'low';
}