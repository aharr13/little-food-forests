// src/components/Landing/ClaudeReplay.tsx
// The landing page's showpiece: a deterministic, animated replay of a real
// Claude food-forest design session. Claude reads the site, places water
// features first (swale + rain garden), then nests each plant into a guild —
// narrating WHERE it goes, WHY, and the ROLE it plays, in plain English — while
// the plan fills in on a property map. No API calls: it always works and costs
// nothing, but mirrors what the live advisor actually does.
import { useEffect, useRef, useState } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';

const LAYER: Record<string, { layer: string; color: string }> = {
  water:      { layer: 'Water',      color: '#3b9ec4' },
  canopy:     { layer: 'Canopy',     color: '#15803d' },
  understory: { layer: 'Understory', color: '#16a34a' },
  shrub:      { layer: 'Shrub',      color: '#65a30d' },
  herb:       { layer: 'Herbaceous', color: '#ca8a04' },
  ground:     { layer: 'Groundcover',color: '#0891b2' },
  vine:       { layer: 'Vine',       color: '#7c3aed' },
};

interface Placement {
  name: string; emoji: string; key: keyof typeof LAYER;
  role: string;          // one or two plain words shown on the map
  x: number; y: number;  // percent within the map
}
// A water feature drawn as an SVG shape on the map.
interface Water {
  key: 'swale' | 'pond';
  d?: string;            // path (swale)
  cx?: number; cy?: number; rx?: number; ry?: number; // ellipse (pond)
}
interface Step { text: string; plant?: Placement; water?: Water }

const SCRIPT: Step[] = [
  { text: 'Reading the site: a south-facing slope, full sun along the south edge, and a low corner to the NE where rain collects.' },
  { text: 'Permaculture rule #1 — water before plants. A swale on contour to slow runoff and soak it into the slope.', water: { key: 'swale', d: 'M8,58 Q50,68 92,56' } },
  { text: 'A rain garden in the low NE corner to catch the overflow — and a home for plants that like wet feet.', water: { key: 'pond', cx: 80, cy: 74, rx: 12, ry: 8 } },
  { text: 'Canopy first, so every lower layer can shelter in its shade.' },
  { text: 'Pecan → NW, the tallest, driest spot. Role: the anchor — decades of shade and a nut harvest.', plant: { name: 'Pecan', emoji: '🌳', key: 'canopy', role: 'anchor tree', x: 22, y: 26 } },
  { text: 'Mulberry → NE above the rain garden. Role: fast shade + fruit, and it loves the extra moisture.', plant: { name: 'Mulberry', emoji: '🌳', key: 'canopy', role: 'fruit + shade', x: 70, y: 30 } },
  { text: 'Pawpaw → tucked under the pecan. Role: understory fruit that actually prefers part shade when young.', plant: { name: 'Pawpaw', emoji: '🌲', key: 'understory', role: 'shade fruit', x: 40, y: 40 } },
  { text: 'Elderberry → at the rain garden\'s edge. Role: berries for you and the birds; thrives with wet feet.', plant: { name: 'Elderberry', emoji: '🫐', key: 'shrub', role: 'loves water', x: 80, y: 58 } },
  { text: 'Currant → shady north pocket west of the pecan. Role: shade-tolerant berries in unused space.', plant: { name: 'Currant', emoji: '🍇', key: 'shrub', role: 'shade berries', x: 13, y: 46 } },
  { text: 'Comfrey → ringing the pecan. Role: nutrient pump — deep roots mine minerals, leaves become mulch.', plant: { name: 'Comfrey', emoji: '🌿', key: 'herb', role: 'nutrient pump', x: 30, y: 38 } },
  { text: 'Echinacea → the sunny south band. Role: pollinator magnet with a long bloom (and medicine).', plant: { name: 'Echinacea', emoji: '🌸', key: 'herb', role: 'pollinators', x: 52, y: 76 } },
  { text: 'Grape → the south trellis edge. Role: climbs vertical space we\'d waste, in maximum sun.', plant: { name: 'Grape', emoji: '🍇', key: 'vine', role: 'vertical crop', x: 90, y: 80 } },
  { text: 'Dutch clover → across the open ground. Role: nitrogen fixer + living mulch that feeds the soil.', plant: { name: 'Clover', emoji: '🍀', key: 'ground', role: 'N-fixer', x: 46, y: 60 } },
  { text: 'Strawberry → the sunny front edge. Role: an edible groundcover you can actually pick.', plant: { name: 'Strawberry', emoji: '🍓', key: 'ground', role: 'edible cover', x: 22, y: 70 } },
  { text: 'Water shapes the plan; every plant earns its place. Returning the layout as structured JSON for the map.' },
];

const STEP_MS = 1250;
const LOOP_PAUSE_MS = 4600;

export function ClaudeReplay() {
  const [shown, setShown] = useState(0);
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

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  const steps = SCRIPT.slice(0, shown);
  const placed = steps.filter((s): s is Step & { plant: Placement } => !!s.plant).map(s => s.plant);
  const waters = steps.filter((s): s is Step & { water: Water } => !!s.water).map(s => s.water);
  const usedLayers = Array.from(new Set([...waters.map(() => 'water'), ...placed.map(p => p.key)]));

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
                  {s.water && (
                    <span className="replay-tag" style={{ background: LAYER.water.color }}>Water</span>
                  )}
                </span>
              </div>
            ))}
            {!done && <div className="replay-thinking"><span /><span /><span /></div>}
          </div>
        </div>

        {/* Property map */}
        <div className="replay-map" aria-label="Property map of the food forest being designed">
          <div className="replay-compass">N ↑</div>
          <div className="replay-sun">☀️ <span>full sun S</span></div>
          <div className="replay-yard">
            {/* water features */}
            <svg className="replay-water" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {waters.map((w, i) => w.key === 'swale' ? (
                <path key={i} d={w.d} className="replay-swale" />
              ) : (
                <ellipse key={i} cx={w.cx} cy={w.cy} rx={w.rx} ry={w.ry} className="replay-pond" />
              ))}
            </svg>

            {/* home marker for orientation */}
            <div className="replay-home" title="house">🏠</div>

            {/* plant placements */}
            {placed.map((p, i) => (
              <div
                key={p.name}
                className="replay-marker"
                style={{ left: `${p.x}%`, top: `${p.y}%`, borderColor: LAYER[p.key].color, animationDelay: `${i * 0.02}s` }}
                title={`${p.name} · ${LAYER[p.key].layer} · ${p.role}`}
              >
                <span className="replay-marker-emoji">{p.emoji}</span>
                <span className="replay-marker-name">{p.name}</span>
                <span className="replay-marker-role">{p.role}</span>
              </div>
            ))}

            {placed.length === 0 && waters.length === 0 && <div className="replay-yard-empty">your property</div>}
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
