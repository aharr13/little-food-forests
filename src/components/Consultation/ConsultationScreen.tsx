// src/components/Consultation/ConsultationScreen.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { X, Send, Map, Loader, ChevronRight, Sparkles, Save } from 'lucide-react';
import { Shape, Plant, Point, WaterFeature, FOOD_FOREST_LAYERS, GUILD_FUNCTIONS, GuildFunction, ConversationMessage, RejectedPlant } from '../../types';
import { buildSkillContext, formatWikiContext } from './skillContext';
import type { WikiArticleSlim } from '../../hooks/useWikiArticles';
import type { UserProfile } from '../../hooks/useUserProfile';
import { functions } from '../../firebase';
import { usePlants } from '../../hooks/usePlants';
import { addNewPlantsToDb } from '../../utils/plantDbExpand';
import './ConsultationScreen.css';

// Calls the server-side Cloud Function that holds the Anthropic API key.
// The key is never present in the browser bundle.
type ClaudeRequest = {
  model: string;
  max_tokens: number;
  system?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
};
const claudeProxy = httpsCallable<ClaudeRequest, { text: string }>(functions, 'claudeProxy', { timeout: 300000 }); // 5 min — layout/generation can be slow

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface PlantRecommendation {
  commonName: string;
  scientificName: string;
  layer: string;
  reason: string;
  effortLevel: 1 | 2 | 3 | 4 | 5;
  timeToEstablish: string;
  fillsGuildFunctions: GuildFunction[];
  priority: 'high' | 'medium' | 'low';
}

export interface PlacementSuggestion {
  plantName: string;
  layer: string;
  nearPlantName: string;
  direction: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  distanceFt: number;
  reason: string;
  sunScore: string;
  guildRole?: string;
}

interface ConsultationScreenProps {
  shapes: Shape[];
  wikiArticles: WikiArticleSlim[];
  onClose: () => void;
  onGoToMap: (recommendations: PlantRecommendation[]) => void;
  onSavePlan: (recommendations: PlantRecommendation[]) => void;
  onPlacementSuggestion?: (suggestion: PlacementSuggestion) => void;
  savedPlan: PlantRecommendation[];
  isVisible: boolean;
  followUpPlantName?: string | null;
  onFollowUpConsumed?: () => void;
  userProfile?: UserProfile;
  onProfileUpdate?: (updates: Partial<UserProfile>) => void;
  consultationHistory?: ConversationMessage[];
  onSaveConsultationHistory?: (messages: ConversationMessage[]) => void;
  rejectedPlants?: RejectedPlant[];
  onSaveRejectedPlants?: (rejected: RejectedPlant[]) => void;
  // Auto-layout: advisor places a whole plant list onto the map as editable shapes
  waterFeatures?: WaterFeature[];
  boundary?: Point[];
  onApplyLayout?: (shapes: Shape[]) => void;
  // Docked side-panel mode (vs full-screen overlay)
  docked?: boolean;
  onToggleDock?: () => void;
}

// Build a summary of what's on the map for the system prompt, including coordinates
// so Claude can reason about placement (sun direction, spacing, proximity)
function buildMapSummary(shapes: Shape[]): string {
  if (shapes.length === 0) return 'The map is currently empty — no plants have been placed yet.';

  const lines = shapes
    .filter(s => s.plantName)
    .map(s => {
      const layer = FOOD_FOREST_LAYERS.find(l => l.id === s.layerId);
      const layerName = layer?.name || s.layerId;
      const pos = s.center
        ? `${s.center.lat.toFixed(5)}°N, ${Math.abs(s.center.lng).toFixed(5)}°W`
        : s.points?.[0]
          ? `${s.points[0].lat.toFixed(5)}°N, ${Math.abs(s.points[0].lng).toFixed(5)}°W`
          : 'position unknown';
      const size = s.canopyRadius ? `, canopy ~${s.canopyRadius}ft` : s.radius ? `, radius ~${s.radius}ft` : '';
      const status = s.status ? ` [${s.status}]` : '';
      return `  - ${s.plantName} (${layerName}) at ${pos}${size}${status}`;
    });

  const unassigned = shapes.filter(s => !s.plantName).length;
  const note = unassigned > 0 ? `\n  (+ ${unassigned} unassigned shape${unassigned > 1 ? 's' : ''})` : '';

  return `Current plants on the map (coordinates in decimal degrees — Texas is ~30°N, 97-100°W):\n${lines.join('\n')}${note}\n\nNote: In Texas (Northern Hemisphere), south-facing sides get more sun. North of a canopy tree = shaded. South = sunny.`;
}

function buildSavedPlanSummary(plan: PlantRecommendation[]): string {
  if (plan.length === 0) return '';
  const lines = plan.map(p => `  - ${p.commonName} (${p.layer}, ${p.priority} priority): ${p.reason.slice(0, 80)}...`);
  return `\nSAVED PLANT PLAN (user's current plan — you can refine this):\n${lines.join('\n')}`;
}

function formatProfile(profile: UserProfile): string {
  const fields: [keyof UserProfile, string][] = [
    ['goals',         'Goals'],
    ['experience',    'Experience'],
    ['timeAvailable', 'Time available'],
    ['soilType',      'Soil type'],
    ['waterSource',   'Water/irrigation'],
    ['constraints',   'Constraints/challenges'],
    ['interests',     'Interests'],
    ['family',        'Household (kids, pets, allergies)'],
    ['otherNotes',    'Other notes'],
  ];
  const lines = fields
    .filter(([k]) => profile[k])
    .map(([k, label]) => `  - ${label}: ${profile[k]}`);
  return lines.length > 0
    ? lines.join('\n')
    : '  (no profile info yet — ask questions to learn about the user)';
}

function buildWaterSummary(waterFeatures: WaterFeature[] = []): string {
  if (waterFeatures.length === 0) {
    return 'WATER & TOPOGRAPHY: The user has not marked any water or topography features yet.';
  }
  const lines = waterFeatures.map(w => {
    const pos = `${w.position.lat.toFixed(5)}°N, ${Math.abs(w.position.lng).toFixed(5)}°W`;
    const note = w.notes ? ` — ${w.notes}` : '';
    return `  - ${w.type} at ${pos}${note}`;
  });
  return `WATER & TOPOGRAPHY (the user has ALREADY marked these on the map — use them; do NOT ask where moisture/water/low spots are):\n${lines.join('\n')}\n\nGuidance: water pools at low points and below downspouts; high points are drier. Put water-loving plants near low/pooling areas and drought-tolerant plants on high/dry areas.`;
}

// Distance between two lat/lng points, in feet
function distanceFeet(p1: Point, p2: Point): number {
  const R = 20925524.9; // earth radius in feet
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Real guild-coverage analysis fed to the advisor: for each anchor tree, which
// of the 5 guild functions are covered by nearby plants and which are missing.
function buildGuildAnalysisSummary(shapes: Shape[], plants: Plant[]): string {
  // NOTE: `Map` is imported from lucide-react (an icon) in this file, which
  // shadows the built-in Map constructor — so we use plain objects here.
  const byId: Record<string, Plant> = {};
  const bySci: Record<string, Plant> = {};
  const byName: Record<string, Plant> = {};
  plants.forEach(p => {
    byId[p.id] = p;
    if (p.scientificName) bySci[p.scientificName.toLowerCase()] = p;
    if (p.commonName) byName[p.commonName.toLowerCase()] = p;
  });
  const plantFor = (s: Shape): Plant | null =>
    (s.plantId ? byId[s.plantId] : undefined) ||
    (s.plantScientificName ? bySci[s.plantScientificName.toLowerCase()] : undefined) ||
    (s.plantName ? byName[s.plantName.toLowerCase()] : undefined) || null;
  const centerOf = (s: Shape): Point | null => s.center || s.points?.[0] || null;

  const anchors = shapes.filter(s => (s.layerId === 'canopy' || s.layerId === 'understory') && centerOf(s));
  if (anchors.length === 0) {
    return 'GUILD STATUS: No canopy/understory anchor trees placed yet. Guilds form around anchor trees — each should be surrounded by plants covering nitrogen-fixer, dynamic-accumulator, insectary, mulch-producer, and pest-confuser roles.';
  }

  const lines = anchors.map(a => {
    const ac = centerOf(a)!;
    const ap = plantFor(a);
    const radius = (a.canopyRadius || 15) * 2;
    const covered = new Set<string>();
    ap?.guildFunctions?.forEach(f => covered.add(f));
    shapes.forEach(s => {
      if (s.id === a.id) return;
      const c = centerOf(s);
      if (c && distanceFeet(ac, c) <= radius) {
        plantFor(s)?.guildFunctions?.forEach(f => covered.add(f));
      }
    });
    const missing = GUILD_FUNCTIONS.filter(g => !covered.has(g.id)).map(g => g.name);
    const name = a.plantName || ap?.commonName || 'unnamed tree';
    const coveredNames = GUILD_FUNCTIONS.filter(g => covered.has(g.id)).map(g => g.name);
    return `  - ${name}: covered [${coveredNames.join(', ') || 'none'}]; MISSING [${missing.join(', ') || 'none — complete guild!'}]`;
  });

  return `GUILD STATUS (per anchor tree, within 2× its canopy radius — the 5 functions are nitrogen-fixer, dynamic-accumulator, insectary, mulch-producer, pest-confuser):\n${lines.join('\n')}\n\nWhen recommending or placing plants, PRIORITIZE filling the MISSING functions near each anchor.`;
}

function buildSystemPrompt(shapes: Shape[], savedPlan: PlantRecommendation[] = [], wikiArticles: WikiArticleSlim[] = [], messages: { role: string; content: string }[] = [], userProfile: UserProfile = {}, rejectedPlants: RejectedPlant[] = [], waterFeatures: WaterFeature[] = [], plants: Plant[] = []): string {
  const mapSummary = buildMapSummary(shapes);
  const waterSummary = buildWaterSummary(waterFeatures);
  const guildSummary = buildGuildAnalysisSummary(shapes, plants);
  const planSummary = buildSavedPlanSummary(savedPlan);
  const skillContext = buildSkillContext();
  // Pass recent conversation text so tag-based filtering can surface relevant articles
  const conversationText = messages.slice(-10).map(m => m.content).join(' ');
  const wikiContext = formatWikiContext(wikiArticles, conversationText);

  const profileSection = formatProfile(userProfile);

  // Build rejected plants summary for system prompt
  const rejectedPlantsSection = rejectedPlants.length > 0
    ? `\nREJECTED PLANTS (user decided these weren't right for their plan — do NOT recommend again unless explicitly asked):\n${rejectedPlants
      .map(p => `  - ${p.commonName} (${p.layer}): "${p.reason.slice(0, 100)}..." - rejected on ${p.rejectedAt?.toLocaleDateString?.() || 'recent date'}`)
      .join('\n')}\n`
    : '';

  return `You are a permaculture food forest advisor embedded in the Little Food Forests design app.
You help homeowners in Texas design, plan, and grow food forests through conversation.

${skillContext}

---

USER PROFILE (persisted across sessions — treat this as already-known information, do NOT re-ask these questions):
${profileSection}
${rejectedPlantsSection}
---

CURRENT DESIGN STATE:
${mapSummary}

${waterSummary}

${guildSummary}${planSummary}${wikiContext}

YOUR CONVERSATION APPROACH:
1. Start by greeting the user warmly. If the profile above has information, acknowledge it and skip those questions.
2. Ask ONE focused question at a time — never overwhelm with multiple questions
3. Only gather information NOT already in the profile, in this order (naturally, conversationally):
   - Their primary goals (food production, wildlife, beauty, low maintenance, etc.)
   - Experience level and how much time they want to spend
   - Effort preference (quick wins vs long-term investment)
   - Any specific plants they love or want
   - Site challenges (shade, drainage, soil, deer, etc.)
4. After you have enough context (from profile + conversation), make recommendations
5. When ready, say "I have a good picture of what you need — let me put together your plant plan." then produce the recommendations

RECOMMENDATION FORMAT:
When producing recommendations, end your message with a JSON block in this exact format (after your conversational text):

<recommendations>
[
  {
    "commonName": "Plant Name",
    "scientificName": "Scientific name",
    "layer": "canopy|understory|shrub|herbaceous|groundcover|rhizosphere|vine",
    "reason": "2-3 sentence explanation of why this plant is perfect for them specifically",
    "effortLevel": 1,
    "timeToEstablish": "1-2 years",
    "fillsGuildFunctions": ["nitrogen-fixer"],
    "priority": "high"
  }
]
</recommendations>

Effort levels: 1=very easy, 2=easy, 3=moderate, 4=challenging, 5=expert
Priority: high=fills critical gaps or user requested, medium=nice to have, low=optional enhancement

PLACEMENT SUGGESTION FORMAT:
When a user asks "where should I plant X?", "best spot for X", "where does X go?", or "show me where to put X":
1. Look at the map coordinates above to understand spatial layout
2. Identify the best reference plant (an existing named plant on the map) to place near
3. Consider: sun requirements (south of canopy = sunny, north = shaded), guild completion, spacing
4. End your message with a <placement> JSON block in this exact format:

<placement>
{
  "plantName": "Loquat",
  "layer": "understory",
  "nearPlantName": "Live Oak",
  "direction": "southeast",
  "distanceFt": 15,
  "reason": "Southeast of your Live Oak gets morning full sun while the oak's canopy provides some afternoon relief from Texas heat. This spot has no competing root systems and fills your understory gap.",
  "sunScore": "good — morning full sun, light afternoon shade",
  "guildRole": "understory anchor, fills layer gap"
}
</placement>

Direction must be one of: north, south, east, west, northeast, northwest, southeast, southwest
distanceFt: distance in feet from the center of the reference plant (typically 10-30ft)
Only produce <placement> when asked specifically about where to put ONE single plant.
When the user wants to place several plants, their whole list, or a full design ("place them all", "lay out my garden", "design my layout", "where does everything go"), do NOT emit one-at-a-time <placement> blocks. Instead tell them to click the "Auto-Layout" button at the top of this screen — it reads their boundary, water, and existing plants and places the entire planting at once (and can design the whole guild for them if they leave the list blank).

IMPORTANT RULES:
- Prioritize plants that complete existing guild groupings (fill nitrogen-fixer, dynamic-accumulator, insectary, mulch-producer, pest-confuser roles near existing trees)
- Rank by effort when the user prioritizes ease — suggest easier plants first
- Suggest 5-10 plants total, mix of priorities
- Be specific about WHY each plant fits THIS user's situation
- Use encouraging, friendly language — this person may be new to permaculture
- Texas-appropriate plants preferred (drought tolerance matters)
- Never produce recommendations until you've asked at least 4 questions`;
}

function parseRecommendations(text: string): PlantRecommendation[] {
  const match = text.match(/<recommendations>([\s\S]*?)<\/recommendations>/);
  if (!match) return [];
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return [];
  }
}

function parsePlacement(text: string): PlacementSuggestion | null {
  const match = text.match(/<placement>([\s\S]*?)<\/placement>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim()) as PlacementSuggestion;
  } catch {
    return null;
  }
}

function stripRecommendations(text: string): string {
  return text
    .replace(/<recommendations>[\s\S]*?<\/recommendations>/, '')
    .replace(/<placement>[\s\S]*?<\/placement>/, '')
    .trim();
}

const EFFORT_LABELS: Record<number, string> = {
  1: 'Very Easy', 2: 'Easy', 3: 'Moderate', 4: 'Challenging', 5: 'Expert',
};
const EFFORT_COLORS: Record<number, string> = {
  1: '#059669', 2: '#10b981', 3: '#f59e0b', 4: '#f97316', 5: '#dc2626',
};

export function ConsultationScreen({ shapes, wikiArticles, onClose, onGoToMap, onSavePlan, onPlacementSuggestion, savedPlan, isVisible, followUpPlantName, onFollowUpConsumed, userProfile = {}, onProfileUpdate, consultationHistory = [], onSaveConsultationHistory, rejectedPlants = [], onSaveRejectedPlants, waterFeatures = [], boundary = [], onApplyLayout, docked = false, onToggleDock }: ConsultationScreenProps) {
  const { plants } = usePlants(); // for live guild analysis fed to the advisor
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<PlantRecommendation[]>(savedPlan);
  const [approved, setApproved] = useState<Set<number>>(new Set(savedPlan.map((_, i) => i)));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const systemPrompt = useRef(buildSystemPrompt(shapes, savedPlan, wikiArticles, [], userProfile, rejectedPlants, waterFeatures, plants));
  const pendingFollowUp = useRef<string | null>(null);

  // Load consultation history on mount
  useEffect(() => {
    if (consultationHistory && consultationHistory.length > 0) {
      // Convert Firestore dates if needed and set as initial messages
      const convertedHistory = consultationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
      setMessages(convertedHistory);
    }
  }, []);

  // Keep the system prompt fresh as the map state loads/changes — including
  // water features and shapes, which may arrive from Firestore after mount.
  useEffect(() => {
    systemPrompt.current = buildSystemPrompt(shapes, savedPlan, wikiArticles, messages, userProfile, rejectedPlants, waterFeatures, plants);
  }, [wikiArticles, userProfile, rejectedPlants, waterFeatures, shapes, savedPlan, plants]);


  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // When a plant name is passed back (user returned from placing), queue the follow-up
  useEffect(() => {
    if (followUpPlantName) {
      pendingFollowUp.current = followUpPlantName;
      onFollowUpConsumed?.();
    }
  }, [followUpPlantName]);

  // Fire the follow-up message the moment the panel becomes visible (and there's one pending)
  useEffect(() => {
    if (isVisible && pendingFollowUp.current && !loading) {
      const msg = pendingFollowUp.current;
      pendingFollowUp.current = null;
      sendMessageWith(`I just placed the ${msg} on the map. What should I plant next to build out this guild?`);
    }
  }, [isVisible]);

  // Start the conversation (only if we don't have history)
  useEffect(() => {
    if (messages.length === 0) {
      startConversation();
    }
  }, []);

  // Clear the (persisted) conversation and start a fresh greeting with the
  // current map state — used when the saved history is stale.
  async function startFresh() {
    if (loading) return;
    setMessages([]);
    setRecommendations([]);
    setApproved(new Set());
    onSaveConsultationHistory?.([]);
    systemPrompt.current = buildSystemPrompt(shapes, savedPlan, wikiArticles, [], userProfile, rejectedPlants, waterFeatures, plants);
    await startConversation(true);
  }

  async function startConversation(force = false) {
    // Only start if we don't have history (unless forced via "Start over")
    if (!force && messages.length > 0) return;

    setLoading(true);
    try {
      const res = await claudeProxy({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: systemPrompt.current,
        messages: [{ role: 'user', content: 'Hello! I\'m ready to get some help with my food forest design.' }],
      });

      const fullText = res.data.text;

      const newMessages: Message[] = [{ role: 'assistant', content: fullText }];
      setMessages(newMessages);

      // Save to Firestore if callback provided
      const conversationMessages: ConversationMessage[] = newMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date()
      }));
      onSaveConsultationHistory?.(conversationMessages);
    } catch (err) {
      console.error('Error starting consultation:', err);
      setMessages([{ role: 'assistant', content: 'Sorry, I had trouble connecting. Please check your API key and try again.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // Programmatic send — called when returning from placement
  async function sendMessageWith(text: string) {
    if (loading) return;
    await sendMessageCore(text);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    await sendMessageCore(userMessage);
  }

  async function sendMessageCore(userMessage: string) {

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    // Always rebuild system prompt with current conversation + latest profile + rejected plants
    systemPrompt.current = buildSystemPrompt(shapes, savedPlan, wikiArticles, newMessages, userProfile, rejectedPlants, waterFeatures, plants);

    // Extract profile facts asynchronously (don't await/block main chat)
    extractProfileFacts(userMessage).catch(() => {});

    try {
      const res = await claudeProxy({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        system: systemPrompt.current,
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      });

      const fullText = res.data.text;

      // Check for recommendations
      const recs = parseRecommendations(fullText);
      if (recs.length > 0) {
        setRecommendations(recs);
        setApproved(new Set(recs.map((_, i) => i)));
        // Grow the database with any newly recommended plants (best-effort).
        addNewPlantsToDb(recs.map(r => ({
          commonName: r.commonName,
          scientificName: r.scientificName,
          layer: r.layer,
          guildFunctions: r.fillsGuildFunctions,
        }))).catch(() => {});
      }

      // Check for placement suggestion
      const placement = parsePlacement(fullText);
      if (placement && onPlacementSuggestion) {
        onPlacementSuggestion(placement);
      }

      const updatedMessages: Message[] = [...newMessages, { role: 'assistant', content: fullText }];
      setMessages(updatedMessages);

      // Save entire conversation history to Firestore
      const conversationMessages: ConversationMessage[] = updatedMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date()
      }));
      onSaveConsultationHistory?.(conversationMessages);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessages: Message[] = [...newMessages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }];
      setMessages(errorMessages);

      // Still save even if there was an error
      const conversationMessages: ConversationMessage[] = errorMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date()
      }));
      onSaveConsultationHistory?.(conversationMessages);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // Lightweight extraction: parse user message for profile-worthy facts
  async function extractProfileFacts(userMessage: string) {
    if (!onProfileUpdate) return;
    try {
      const res = await claudeProxy({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: `You extract gardening profile facts from a user message. Return ONLY a valid JSON object — no markdown, no explanation.
Include only fields where the user clearly stated something. Omit unknown fields entirely.
Available fields: goals, experience, timeAvailable, soilType, waterSource, constraints, interests, family, otherNotes
Example output: {"experience":"intermediate","goals":"food for family and wildlife habitat"}`,
        messages: [{ role: 'user', content: userMessage }],
      });
      const text = res.data.text.trim();
      if (!text || text === '{}') return;
      const updates = JSON.parse(text) as Partial<UserProfile>;
      if (Object.keys(updates).length > 0) {
        onProfileUpdate(updates);
      }
    } catch {
      // Extraction is best-effort — never block the conversation
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function toggleApproval(index: number) {
    setApproved(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);

      // Calculate rejected plants based on new approval state
      const rejected: RejectedPlant[] = recommendations
        .map((rec, i) => !next.has(i) ? rec : null)
        .filter((plant): plant is PlantRecommendation => plant !== null)
        .map(rec => ({
          commonName: rec.commonName,
          scientificName: rec.scientificName,
          layer: rec.layer,
          reason: rec.reason,
          rejectedAt: new Date(),
          effortLevel: rec.effortLevel,
          priority: rec.priority
        }));

      // Save rejected plants to Firestore
      onSaveRejectedPlants?.(rejected);

      return next;
    });
  }

  function handleGoToMap() {
    const approvedRecs = recommendations.filter((_, i) => approved.has(i));
    onGoToMap(approvedRecs);
  }

  const layerColor = (layerId: string) =>
    FOOD_FOREST_LAYERS.find(l => l.id === layerId)?.color || '#059669';

  const layerName = (layerId: string) =>
    FOOD_FOREST_LAYERS.find(l => l.id === layerId)?.name || layerId;

  const planList = recommendations.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  // ---- Auto-layout: place a whole plant list onto the map -------------------
  const [showLayout, setShowLayout] = useState(false);
  const [layoutInput, setLayoutInput] = useState('');
  const [layoutBusy, setLayoutBusy] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  function defaultRadiusFt(layer: string): number {
    const map: Record<string, number> = { canopy: 15, understory: 10, shrub: 5, herbaceous: 2, groundcover: 2, rhizosphere: 2, vine: 3 };
    return map[layer] ?? 3;
  }

  function computeBBox() {
    const pts: Point[] = [];
    boundary.forEach(p => pts.push(p));
    if (pts.length === 0) shapes.forEach(s => { if (s.center) pts.push(s.center); });
    if (pts.length === 0) return null;
    const lats = pts.map(p => p.lat);
    const lngs = pts.map(p => p.lng);
    return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) };
  }

  function parseLayoutJSON(text: string): any[] {
    let t = text.trim();
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const start = t.indexOf('[');
    const end = t.lastIndexOf(']');
    if (start >= 0 && end > start) t = t.slice(start, end + 1);
    try {
      const arr = JSON.parse(t);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  async function generateLayout() {
    const names = layoutInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const advisorChooses = names.length === 0; // empty list → advisor designs the planting

    const bbox = computeBBox();
    if (!bbox) { setLayoutError('Trace your property boundary first so I know where to place plants.'); return; }

    setLayoutBusy(true);
    setLayoutError(null);
    try {
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
      const waterText = waterFeatures.length
        ? waterFeatures.map(w => `  - ${w.type} at ${w.position.lat.toFixed(5)}, ${w.position.lng.toFixed(5)}`).join('\n')
        : '  (none marked)';

      const sys = `You are a permaculture designer placing plants on a real satellite map for a Texas food forest.

SITE bounding box (place every plant INSIDE this box):
  latitude:  ${bbox.minLat.toFixed(6)} to ${bbox.maxLat.toFixed(6)}
  longitude: ${bbox.minLng.toFixed(6)} to ${bbox.maxLng.toFixed(6)}

WATER FEATURES:
${waterText}

EXISTING PLANTS (already on the map — do NOT move or duplicate these; place the new plants around them):
${buildMapSummary(shapes)}

${advisorChooses
  ? `YOUR TASK: Design a COMPLETE food-forest planting for this site. YOU decide which species to use — choose mostly Texas-native, climate-appropriate plants that complete guilds around the existing plants (cover nitrogen-fixer, dynamic-accumulator, insectary, mulch-producer, and pest-confuser roles), fill empty layers, and match the sun/water conditions above. Aim for a realistic, well-spaced planting of roughly 12–30 plants across the layers.`
  : `YOUR TASK: Place EVERY plant in the user's list. You may also add a few companion species if they clearly complete a guild.`}

USER'S GOALS & PROFILE (match your plant choices and placement to these):
${formatProfile(userProfile)}

Apply permaculture principles:
- In Texas (Northern Hemisphere) the south side gets the most sun; tall plants shade what's north of them.
- Respect mature spread — don't overlap canopies; space by size.
- Build complete guilds: cluster supporting species (nitrogen-fixers, accumulators, insectary, mulch, pest-confusers) around each canopy/understory anchor.
- Put water-loving plants near low/pooling water markers; drought-tolerant plants on high/dry areas.
- Spread plants sensibly across the whole site, inside the bounding box.

Return ONLY a JSON array — no prose, no markdown fences. Each element:
{"commonName": string, "scientificName": string, "layer": one of ["canopy","understory","shrub","herbaceous","groundcover","rhizosphere","vine"], "lat": number inside the bbox, "lng": number inside the bbox, "radiusFt": number (mature canopy/spread radius in feet), "guildFunctions": array of any of ["nitrogen-fixer","dynamic-accumulator","insectary","mulch-producer","pest-confuser"], "sunRequirement": one of ["full-sun","partial-shade","full-shade"], "waterRequirement": one of ["low","moderate","high"], "edible": boolean, "nativeToTexas": boolean, "reason": short string}`;

      const res = await claudeProxy({
        model: 'claude-opus-4-6',
        max_tokens: 8192,
        system: sys,
        messages: [{
          role: 'user',
          content: advisorChooses
            ? 'Design and place a complete food-forest planting for my site — you choose the species and build the guilds.'
            : `Plants to place:\n${names.join('\n')}`,
        }],
      });

      const validLayers = new Set(FOOD_FOREST_LAYERS.map(l => l.id));
      const placements = parseLayoutJSON(res.data.text);
      const newShapes: Shape[] = placements
        .filter(p => p && typeof p.lat === 'number' && typeof p.lng === 'number')
        .map(p => {
          const layer = validLayers.has(p.layer) ? p.layer : 'herbaceous';
          const isTree = layer === 'canopy' || layer === 'understory';
          const r = Number(p.radiusFt) || defaultRadiusFt(layer);
          return {
            id: `shape_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            layerId: layer,
            type: 'circle' as const,
            center: { lat: clamp(p.lat, bbox.minLat, bbox.maxLat), lng: clamp(p.lng, bbox.minLng, bbox.maxLng) },
            radius: isTree ? Math.max(1, Math.round(r * 0.15)) : 0,
            canopyRadius: r,
            plantName: String(p.commonName || 'Plant'),
            plantScientificName: p.scientificName ? String(p.scientificName) : undefined,
            status: 'planned' as const,
          };
        });

      if (newShapes.length === 0) {
        setLayoutError('The advisor did not return a usable layout. Please try again.');
      } else {
        // Grow the database with any plants the advisor introduced (best-effort).
        addNewPlantsToDb(placements.map(p => ({
          commonName: String(p.commonName || ''),
          scientificName: p.scientificName ? String(p.scientificName) : undefined,
          layer: validLayers.has(p.layer) ? p.layer : 'herbaceous',
          guildFunctions: Array.isArray(p.guildFunctions) ? p.guildFunctions : undefined,
          sunRequirement: typeof p.sunRequirement === 'string' ? p.sunRequirement : undefined,
          waterRequirement: typeof p.waterRequirement === 'string' ? p.waterRequirement : undefined,
          edible: typeof p.edible === 'boolean' ? p.edible : undefined,
          nativeToTexas: typeof p.nativeToTexas === 'boolean' ? p.nativeToTexas : undefined,
        }))).catch(() => {});
        onApplyLayout?.(newShapes);
        setShowLayout(false);
        setLayoutInput('');
      }
    } catch (err) {
      console.error('Layout generation failed:', err);
      setLayoutError('Layout generation failed. Please try again.');
    } finally {
      setLayoutBusy(false);
    }
  }

  return (
    <div
      className="consultation-overlay"
      style={
        !isVisible
          ? { display: 'none' }
          : docked
            // Docked: panel pinned to the right; transparent click-through area on
            // the left so the map stays visible and interactive.
            ? { display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', background: 'transparent', pointerEvents: 'none' }
            : { display: 'flex' }
      }
    >
      <div
        className="consultation-screen"
        style={docked ? { pointerEvents: 'auto', width: 'min(460px, 100%)', height: '100%', maxWidth: 'none', borderRadius: 0, boxShadow: '-8px 0 30px rgba(0,0,0,0.18)' } : undefined}
      >

        {/* Auto-Layout panel */}
        {showLayout && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 'min(520px, 92%)', maxHeight: '88%', overflow: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
              <h3 style={{ margin: '0 0 8px', color: '#064e3b' }}>🌱 Auto-Layout your plants</h3>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                List the plants you have or want — one per line, or comma-separated — and I'll place them all.
                <strong> Or leave it blank and I'll design a complete guild-based planting for you</strong>, choosing the species myself. Either way I read your boundary, water markers, and existing plants, then drop everything on the map as editable shapes.
              </p>
              <textarea
                value={layoutInput}
                onChange={(e) => setLayoutInput(e.target.value)}
                placeholder={'Silver Ponyfoot\nRock Penstemon\nAmerican Black Nightshade'}
                rows={7}
                style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }}
                disabled={layoutBusy}
              />
              {savedPlan.length > 0 && (
                <button
                  onClick={() => setLayoutInput(savedPlan.map(p => p.commonName).join('\n'))}
                  disabled={layoutBusy}
                  style={{ marginTop: 8, background: 'none', border: '1px solid #059669', color: '#059669', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                >
                  Use my {savedPlan.length} recommended plant{savedPlan.length !== 1 ? 's' : ''}
                </button>
              )}
              {layoutError && (
                <div style={{ marginTop: 10, color: '#b91c1c', fontSize: 13 }}>{layoutError}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button onClick={() => setShowLayout(false)} disabled={layoutBusy} style={{ background: '#f1f5f9', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={generateLayout} disabled={layoutBusy} style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: layoutBusy ? 'wait' : 'pointer', fontWeight: 600 }}>
                  {layoutBusy ? 'Designing…' : layoutInput.trim() ? 'Place my plants on the map' : 'Design a full plan for me'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="consultation-header">
          <div className="consultation-header-left">
            <Sparkles size={20} className="consultation-header-icon" />
            <div>
              <h2>AI Garden Advisor</h2>
              <span className="consultation-subtitle">
                {recommendations.length > 0 ? `${recommendations.length} plants planned — chat & plan side by side` : 'Powered by Claude'}
              </span>
            </div>
          </div>
          <div className="consultation-header-actions">
            <button className="consultation-map-btn" onClick={startFresh} disabled={loading} title="Clear this conversation and start fresh with the current map">
              Start over
            </button>
            <button className="consultation-map-btn" onClick={() => { setLayoutError(null); setShowLayout(true); }}>
              <Sparkles size={16} />
              Auto-Layout
            </button>
            {onToggleDock && (
              <button className="consultation-map-btn" onClick={onToggleDock} title={docked ? 'Expand to full screen' : 'Dock beside the map'}>
                {docked ? 'Full screen' : 'Dock'}
              </button>
            )}
            <button className="consultation-map-btn" onClick={onClose}>
              <Map size={16} />
              Back to Map
            </button>
            <button className="consultation-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content — side by side when plan exists */}
        <div className={`consultation-body ${recommendations.length > 0 ? 'has-plan' : ''}`}>

          {/* Chat Panel (always visible) */}
          <div className="consultation-chat">
            <div className="consultation-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`consultation-message ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="consultation-avatar">
                      <Sparkles size={14} />
                    </div>
                  )}
                  <div className="consultation-bubble">
                    {msg.role === 'assistant'
                      ? stripRecommendations(msg.content)
                          .split('\n')
                          .filter(l => l.trim())
                          .map((line, j) => <p key={j}>{line}</p>)
                      : <p>{msg.content}</p>
                    }
                  </div>
                </div>
              ))}
              {loading && (
                <div className="consultation-message assistant">
                  <div className="consultation-avatar">
                    <Sparkles size={14} />
                  </div>
                  <div className="consultation-bubble typing">
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="consultation-input-area">
              <textarea
                ref={inputRef}
                className="consultation-input"
                placeholder="Ask to refine the plan, discuss goals, request wiki info..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={loading}
              />
              <button
                className="consultation-send"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
              >
                <Send size={18} />
              </button>
            </div>
            <p className="consultation-hint">Enter to send • Shift+Enter for new line</p>
          </div>

          {/* Plant Plan Panel — right column, only when recommendations exist */}
          {recommendations.length > 0 && (
            <div className="consultation-plan">
              <div className="plan-header">
                <h3>Your Plant Plan</h3>
                <p>Click to toggle. Discuss changes in chat anytime.</p>
              </div>

              <div className="plan-list">
                {planList.map((rec, i) => (
                  <div
                    key={i}
                    className={`plan-card ${approved.has(i) ? 'approved' : 'skipped'}`}
                    onClick={() => toggleApproval(i)}
                  >
                    <div className="plan-card-check">
                      {approved.has(i) ? '✓' : '○'}
                    </div>
                    <div className="plan-card-body">
                      <div className="plan-card-top">
                        <div>
                          <span className="plan-card-name">{rec.commonName}</span>
                          <span className="plan-card-scientific">{rec.scientificName}</span>
                        </div>
                        <div className="plan-card-badges">
                          <span
                            className="plan-layer-badge"
                            style={{ background: layerColor(rec.layer) + '22', color: layerColor(rec.layer), borderColor: layerColor(rec.layer) + '44' }}
                          >
                            {layerName(rec.layer)}
                          </span>
                          <span
                            className="plan-priority-badge"
                            style={{ opacity: rec.priority === 'high' ? 1 : rec.priority === 'medium' ? 0.8 : 0.6 }}
                          >
                            {rec.priority}
                          </span>
                        </div>
                      </div>

                      <p className="plan-card-reason">{rec.reason}</p>

                      <div className="plan-card-meta">
                        <span className="plan-effort" style={{ color: EFFORT_COLORS[rec.effortLevel] }}>
                          Effort: {EFFORT_LABELS[rec.effortLevel]}
                        </span>
                        <span className="plan-time">⏱ {rec.timeToEstablish}</span>
                        {rec.fillsGuildFunctions?.length > 0 && (
                          <span className="plan-guild">
                            {rec.fillsGuildFunctions.map(f =>
                              GUILD_FUNCTIONS.find(gf => gf.id === f)?.icon
                            ).join(' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="plan-actions">
                <button className="plan-save-btn" onClick={() => onSavePlan(recommendations)}>
                  <Save size={14} />
                  Save Plan
                </button>
                <button
                  className="plan-go-btn"
                  onClick={handleGoToMap}
                  disabled={approved.size === 0}
                >
                  <Map size={16} />
                  Draw {approved.size} Plant{approved.size !== 1 ? 's' : ''}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
