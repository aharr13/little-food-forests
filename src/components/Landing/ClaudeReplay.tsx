// src/components/Landing/ClaudeReplay.tsx
// The landing page's showpiece: a deterministic, animated replay of a real
// Claude food-forest design session. Reasoning lines stream into a transcript
// while plants drop onto a mini-map in guild order. No API calls — it always
// works and costs nothing — but it mirrors exactly what the live advisor does:
// read the map, reason about sun/layers/guilds, and return structured
// placements that render onto the canvas.
import { useEffect, useRef, useState } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';

type LayerColor = { layer: string; color: string };
const LAYER: Record<string, LayerColor> = {
  canopy:     { layer: 'Canopy',     color: '#15803d' },
  understory: { layer: 'Understory', color: '#16a34a' },
  shrub:      { layer: 'Shrub',      color: '#65a30d' },
  herb:       { layer: 'Herbaceous', color: '#ca8a04' },
  ground:     { layer: 'Groundcover',color: '#0891b2' },
  vine:       { layer: 'Vine',       color: '#7c3aed' },
};

interface Placement {
  name: string; emoji: string; key: keyof typeof LAYER;
  x: number; y: number; // percent within the mini-map
}

// Each step shows a line of Claude's "reasoning"; some steps also drop a plant.
interface Step { text: string; plant?: Placement }

const SCRIPT: Step[] = [
  { text: 'Reading the map — a 60×40 ft south-facing yard, full sun along the south edge, a wet low corner to the NE.' },
  { text: 'Anchoring the canopy first so every lower layer can nest in its guild.' },
  { text: 'Pecan → NW, the tallest spot, clear of the house\'s afternoon shadow.', plant: { name: 'Pecan', emoji: '🌳', key: 'canopy', x: 22, y: 24 } },
  { text: 'Mulberry → NE, it loves that wetter corner and screens the fence line.', plant: { name: 'Mulberry', emoji: '🌳', key: 'canopy', x: 74, y: 22 } },
  { text: 'Now the understory in the dappled light beneath the canopy.' },
  { text: 'Pawpaw → tucked east of the pecan; it actually prefers part shade when young.', plant: { name: 'Pawpaw', emoji: '🌲', key: 'understory', x: 42, y: 36 } },
  { text: 'Shrubs form the productive berry layer at the guild edges.' },
  { text: 'Elderberry → by the damp NE corner, a classic mulberry companion.', plant: { name: 'Elderberry', emoji: '🫐', key: 'shrub', x: 80, y: 44 } },
  { text: 'Currant → north-facing shade pocket west of the pecan.', plant: { name: 'Currant', emoji: '🍇', key: 'shrub', x: 14, y: 50 } },
  { text: 'Herbaceous layer: pulling nutrients up and feeding pollinators.' },
  { text: 'Comfrey → ringing the pecan as a dynamic accumulator + chop-and-drop mulch.', plant: { name: 'Comfrey', emoji: '🌿', key: 'herb', x: 30, y: 44 } },
  { text: 'Echinacea → sunny south band for pollinators and a long bloom.', plant: { name: 'Echinacea', emoji: '🌸', key: 'herb', x: 56, y: 66 } },
  { text: 'Vine layer climbs vertical space we\'d otherwise waste.' },
  { text: 'Grape → south trellis edge, maximum sun, off the tree canopies.', plant: { name: 'Grape', emoji: '🍇', key: 'vine', x: 86, y: 70 } },
  { text: 'Groundcover closes the soil so nothing bare invites weeds.' },
  { text: 'Dutch clover → living mulch + nitrogen fixer across the open ground.', plant: { name: 'Clover', emoji: '🍀', key: 'ground', x: 50, y: 84 } },
  { text: 'Strawberry → sunny front edge, an edible groundcover you can pick.', plant: { name: 'Strawberry', emoji: '🍓', key: 'ground', x: 24, y: 78 } },
  { text: '7 layers, 11 plants, every guild anchored. Returning the placements as structured JSON for the map.' },
];

const STEP_MS = 1150;
const LOOP_PAUSE_MS = 4200;

export function ClaudeReplay() {
  const [shown, setShown] = useState(0);       // how many steps have played
  const [done, setDone] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shown >= SCRIPT.length) {
      setDone(true);
      const t = setTimeout(() => { setShown(0); setDone(false); }, LOOP_PAUSE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown(s => s + 1), shown === 0 ? 400 : STEP_MS);
    return () => clearTimeout(t);
  }, [shown]);

  // Keep the newest reasoning line in view.
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  const steps = SCRIPT.slice(0, shown);
  const placed = steps.filter((s): s is Required<Step> => !!s.plant).map(s => s.plant);
  const usedLayers = Array.from(new Set(placed.map(p => p.key)));

  return (
    <div className="replay">
      <div className="replay-badge">
        <Sparkles size={14} /> Recorded Claude session · replays in real time
      </div>

      <div className="replay-grid">
        {/* Reasoning transcript */}
        <div className="replay-stream">
          <div className="replay-stream-head">
            <span className="replay-dot" /><span className="replay-dot" /><span className="replay-dot" />
            <span className="replay-model">claude-opus-4-8 · designing your forest</span>
          </div>
          <div className="replay-transcript" ref={transcriptRef}>
            {steps.map((s, i) => (
              <div key={i} className="replay-line">
                <span className="replay-caret">›</span>
                <span>
                  {s.text}
                  {s.plant && (
                    <span className="replay-tag" style={{ background: LAYER[s.plant.key].color }}>
                      {LAYER[s.plant.key].layer}
                    </span>
                  )}
                </span>
              </div>
            ))}
            {!done && <div className="replay-thinking"><span /><span /><span /></div>}
          </div>
        </div>

        {/* Mini-map */}
        <div className="replay-map" aria-label="Mini-map of the food forest being designed">
          <div className="replay-sun">☀️ <span>full sun</span></div>
          <div className="replay-yard">
            {placed.map((p, i) => (
              <div
                key={p.name}
                className="replay-marker"
                style={{ left: `${p.x}%`, top: `${p.y}%`, borderColor: LAYER[p.key].color, animationDelay: `${i * 0.02}s` }}
                title={`${p.name} · ${LAYER[p.key].layer}`}
              >
                <span className="replay-marker-emoji">{p.emoji}</span>
                <span className="replay-marker-name">{p.name}</span>
              </div>
            ))}
            {placed.length === 0 && <div className="replay-yard-empty">your yard</div>}
          </div>
          <div className="replay-legend">
            {usedLayers.map(k => (
              <span key={k} className="replay-legend-item">
                <span className="replay-swatch" style={{ background: LAYER[k].color }} />
                {LAYER[k].layer}
              </span>
            ))}
          </div>
        </div>
      </div>

      {done && (
        <button className="replay-restart" onClick={() => { setShown(0); setDone(false); }}>
          <RotateCcw size={15} /> Replay
        </button>
      )}
    </div>
  );
}
