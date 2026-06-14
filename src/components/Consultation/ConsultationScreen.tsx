// src/components/Consultation/ConsultationScreen.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { X, Send, Map, Loader, ChevronRight, Sparkles, Save } from 'lucide-react';
import { Shape, Plant, FOOD_FOREST_LAYERS, GUILD_FUNCTIONS, GuildFunction, ConversationMessage, RejectedPlant } from '../../types';
import { buildSkillContext, formatWikiContext } from './skillContext';
import type { WikiArticleSlim } from '../../hooks/useWikiArticles';
import type { UserProfile } from '../../hooks/useUserProfile';
import './ConsultationScreen.css';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

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

// Build guild coverage summary
function buildGuildSummary(shapes: Shape[]): string {
  const plantedFunctions = new Set<string>();
  shapes.forEach(s => {
    // We don't have guild functions per shape here, just note what layers are covered
  });

  const coveredLayers = [...new Set(shapes.map(s => s.layerId))];
  const missingLayers = FOOD_FOREST_LAYERS
    .filter(l => !coveredLayers.includes(l.id) && l.id !== 'infrastructure')
    .map(l => l.name);

  if (missingLayers.length === 0) return 'All food forest layers have plants.';
  return `Layers not yet planted: ${missingLayers.join(', ')}`;
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

function buildSystemPrompt(shapes: Shape[], savedPlan: PlantRecommendation[] = [], wikiArticles: WikiArticleSlim[] = [], messages: { role: string; content: string }[] = [], userProfile: UserProfile = {}, rejectedPlants: RejectedPlant[] = []): string {
  const mapSummary = buildMapSummary(shapes);
  const guildSummary = buildGuildSummary(shapes);
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
Only produce <placement> when asked specifically about where to put a single plant.

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

export function ConsultationScreen({ shapes, wikiArticles, onClose, onGoToMap, onSavePlan, onPlacementSuggestion, savedPlan, isVisible, followUpPlantName, onFollowUpConsumed, userProfile = {}, onProfileUpdate, consultationHistory = [], onSaveConsultationHistory, rejectedPlants = [], onSaveRejectedPlants }: ConsultationScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<PlantRecommendation[]>(savedPlan);
  const [approved, setApproved] = useState<Set<number>>(new Set(savedPlan.map((_, i) => i)));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const systemPrompt = useRef(buildSystemPrompt(shapes, savedPlan, wikiArticles, [], userProfile, rejectedPlants));
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

  // Rebuild system prompt when wiki articles, profile, or rejected plants change
  useEffect(() => {
    if (wikiArticles.length > 0) {
      systemPrompt.current = buildSystemPrompt(shapes, savedPlan, wikiArticles, messages, userProfile, rejectedPlants);
    }
  }, [wikiArticles, userProfile, rejectedPlants]);


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

  async function startConversation() {
    // Only start if we don't have history
    if (messages.length > 0) return;

    setLoading(true);
    try {
      const stream = client.messages.stream({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: systemPrompt.current,
        messages: [{ role: 'user', content: 'Hello! I\'m ready to get some help with my food forest design.' }],
      });

      let fullText = '';

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullText += event.delta.text;
        }
      }

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
    systemPrompt.current = buildSystemPrompt(shapes, savedPlan, wikiArticles, newMessages, userProfile, rejectedPlants);

    // Extract profile facts asynchronously (don't await/block main chat)
    extractProfileFacts(userMessage).catch(() => {});

    try {
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), 30000); // 30s timeout

      const stream = client.messages.stream({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        system: systemPrompt.current,
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      });

      let fullText = '';

      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
          }
        }
      } finally {
        clearTimeout(timeout);
      }

      // Check for recommendations
      const recs = parseRecommendations(fullText);
      if (recs.length > 0) {
        setRecommendations(recs);
        setApproved(new Set(recs.map((_, i) => i)));
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
      const errorMsg = err instanceof Error && err.name === 'AbortError'
        ? 'Request timed out. Please try again.'
        : 'Sorry, something went wrong. Please try again.';
      const errorMessages: Message[] = [...newMessages, { role: 'assistant', content: errorMsg }];
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
      const result = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: `You extract gardening profile facts from a user message. Return ONLY a valid JSON object — no markdown, no explanation.
Include only fields where the user clearly stated something. Omit unknown fields entirely.
Available fields: goals, experience, timeAvailable, soilType, waterSource, constraints, interests, family, otherNotes
Example output: {"experience":"intermediate","goals":"food for family and wildlife habitat"}`,
        messages: [{ role: 'user', content: userMessage }],
      });
      const text = result.content[0].type === 'text' ? result.content[0].text.trim() : '';
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

  return (
    <div className="consultation-overlay" style={{ display: isVisible ? 'flex' : 'none' }}>
      <div className="consultation-screen">

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
