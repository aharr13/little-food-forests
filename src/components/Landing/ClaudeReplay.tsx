// src/components/Landing/ClaudeReplay.tsx
// The landing page's showpiece: a deterministic, animated replay of a real
// Claude food-forest design session, laid over a map-style property view (a
// house footprint, street, driveway, lot boundary). Claude places water first
// (swale + rain garden), then nests each plant into a guild — narrating WHERE
// it goes, WHY, and the ROLE it plays in plain English — as the plan fills in.
// No API calls: it always works and costs nothing, but mirrors what the live
// advisor actually does.
import { useEffect, useRef, useState } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';

const LAYER: Record<string, { layer: string; color: string }> = {
  water:      { layer: 'Water',      color: '#2f97c4' },
  canopy:     { layer: 'Canopy',     color: '#15803d' },
  understory: { layer: 'Understory', color: '#16a34a' },
  shrub:      { layer: 'Shrub',      color: '#4d7c0f' },
  herb:       { layer: 'Herbaceous', color: '#b45309' },
  ground:     { layer: 'Groundcover',color: '#0e7490' },
  vine:       { layer: 'Vine',       color: '#7c3aed' },
};

interface Placement {
  name: string; emoji: string; key: keyof typeof LAYER;
  role: string;          // a short plain-English role, shown on the map marker
  x: number; y: number;  // percent within the property
}
interface Water {
  key: 'swale' | 'pond';
  d?: string;                                          // path (swale)
  cx?: number; cy?: number; rx?: number; ry?: number;  // ellipse (rain garden)
}
interface Step { text: string; plant?: Placement; water?: Water }

const SCRIPT: Step[] = [
  { text: 'Reading the lot: house at the south/front, a back yard sloping gently away, full sun along the south edge, and a low spot to the east where rain pools.' },
  { text: 'Permaculture rule #1 — water before plants. A swale on contour across the slope to slow runoff and soak it in.', water: { key: 'swale', d: 'M6,52 Q50,60 94,50' } },
  { text: 'A rain garden in the low east corner to catch overflow — and a home for plants that like wet feet.', water: { key: 'pond', cx: 82, cy: 38, rx: 9, ry: 6 } },
  { text: 'Canopy first, so every lower layer can shelter in its shade.' },
  { text: 'Pecan → back NW, the tallest, driest spot. Role: the anchor — decades of shade and a nut harvest.', plant: { name: 'Pecan', emoji: '🌳', key: 'canopy', role: 'anchor tree', x: 20, y: 22 } },
  { text: 'Mulberry → back NE. Role: fast shade + fruit, and it loves the moisture near the rain garden.', plant: { name: 'Mulberry', emoji: '🌳', key: 'canopy', role: 'fruit + shade', x: 74, y: 20 } },
  { text: 'Pawpaw → under the pecan. Role: understory fruit that prefers part shade when young.', plant: { name: 'Pawpaw', emoji: '🌲', key: 'understory', role: 'shade fruit', x: 44, y: 36 } },
  { text: 'Elderberry → at the rain garden\'s edge. Role: berries for you and the birds; thrives with wet feet.', plant: { name: 'Elderberry', emoji: '🫐', key: 'shrub', role: 'loves water', x: 84, y: 50 } },
  { text: 'Currant → shady west pocket. Role: shade-tolerant berries in space nothing else wants.', plant: { name: 'Currant', emoji: '🍇', key: 'shrub', role: 'shade berries', x: 10, y: 40 } },
  { text: 'Comfrey → ringing the pecan. Role: nutrient pump — deep roots mine minerals, leaves become mulch.', plant: { name: 'Comfrey', emoji: '🌿', key: 'herb', role: 'nutrient pump', x: 28, y: 33 } },
  { text: 'Echinacea → the sunny mid band. Role: pollinator magnet with a long bloom (and medicine).', plant: { name: 'Echinacea', emoji: '🌸', key: 'herb', role: 'pollinators', x: 58, y: 62 } },
  { text: 'Grape → the sunny east trellis. Role: climbs vertical space we\'d otherwise waste.', plant: { name: 'Grape', emoji: '🍇', key: 'vine', role: 'vertical crop', x: 92, y: 66 } },
  { text: 'Dutch clover → across the open ground. Role: nitrogen fixer + living mulch that feeds the soil.', plant: { name: 'Clover', emoji: '🍀', key: 'ground', role: 'N-fixer', x: 54, y: 48 } },
  { text: 'Strawberry → sunny front edge, right of the house. Role: an edible groundcover you can actually pick.', plant: { name: 'Strawberry', emoji: '🍓', key: 'ground', role: 'edible cover', x: 64, y: 80 } },
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
                  {s.water && <span className="replay-tag" style={{ background: LAYER.water.color }}>Water</span>}
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
            {/* map base: lot boundary, street, driveway, house footprint */}
            <svg className="replay-basemap" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <rect x="2.5" y="2.5" width="95" height="88" className="rm-parcel" />
              <line x1="97.6" y1="2.5" x2="97.6" y2="90.5" className="rm-faint" />
              <rect x="0" y="93" width="100" height="7" className="rm-road" />
              <line x1="0" y1="96.5" x2="100" y2="96.5" className="rm-roadline" />
              <line x1="0" y1="92.5" x2="100" y2="92.5" className="rm-curb" />
              <rect x="30" y="88" width="8" height="5.5" className="rm-drive" />
              <rect x="8" y="72" width="33" height="17" className="rm-house" />
              <line x1="8" y1="80.5" x2="41" y2="80.5" className="rm-houseline" />
            </svg>
            <span className="replay-house-label">House</span>

            {/* water features */}
            <svg className="replay-water" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {waters.map((w, i) => w.key === 'swale'
                ? <path key={i} d={w.d} className="replay-swale" />
                : <ellipse key={i} cx={w.cx} cy={w.cy} rx={w.rx} ry={w.ry} className="replay-pond" />)}
            </svg>

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
