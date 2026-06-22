// src/components/Landing/ClaudeReplay.tsx
// The landing page's showpiece: a deterministic, animated replay of a real
// Claude food-forest design session, rendered the way the actual app draws a
// site — canopy circles sized to mature spread, a tilted lot boundary, faint
// neighbor lots, a house footprint. Claude works in a sensible order (water →
// canopy → guilds → annual rows) and narrates the *why* with real agronomy:
// juglone exclusion around the pecan, shade guilds, nitrogen fixing,
// pollination, and a pet-toxicity caution. No API calls — it always works and
// costs nothing — but it mirrors what the live advisor does.
import { useEffect, useRef, useState } from 'react';
import { Sparkles, RotateCcw, AlertTriangle } from 'lucide-react';

type LayerKey = 'water' | 'canopy' | 'understory' | 'shrub' | 'herb' | 'ground' | 'vine' | 'veg';
const LAYER: Record<LayerKey, { layer: string; color: string }> = {
  water:      { layer: 'Water',       color: '#2f97c4' },
  canopy:     { layer: 'Canopy',      color: '#2f7d32' },
  understory: { layer: 'Understory',  color: '#3f9142' },
  shrub:      { layer: 'Shrub',       color: '#6f9e2f' },
  herb:       { layer: 'Herbaceous',  color: '#c08a1e' },
  ground:     { layer: 'Groundcover', color: '#1c97a6' },
  vine:       { layer: 'Vine',        color: '#7c3aed' },
  veg:        { layer: 'Annual veg',  color: '#d1495b' },
};

interface Plant { name: string; key: LayerKey; x: number; y: number; spread: number }
interface Bed { name: string; x: number; y: number; cols: number; rows: number } // annual veg in rows
type Water =
  | { kind: 'swale'; d: string }
  | { kind: 'pond'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'juglone'; cx: number; cy: number; r: number };
interface Step { text: string; plant?: Plant; bed?: Bed; water?: Water; tag?: LayerKey; warn?: boolean }

const SCRIPT: Step[] = [
  { text: 'Reading the lot: house toward the front, a back yard with full sun on the south edge and a low, wet corner to the NE.' },
  { text: 'Water before plants. A swale on contour to slow runoff and soak it into the slope.', tag: 'water', water: { kind: 'swale', d: 'M14,44 Q50,52 86,40' } },
  { text: 'A rain garden in the low NE corner to hold the overflow.', tag: 'water', water: { kind: 'pond', cx: 74, cy: 26, rx: 9, ry: 6 } },
  { text: 'Pecan anchors the canopy — NW, the tallest, driest spot. Decades of shade and a nut crop.', tag: 'canopy', plant: { name: 'Pecan', key: 'canopy', x: 32, y: 30, spread: 19 } },
  { text: 'Important: pecan roots release juglone — toxic to tomatoes, peppers and potatoes. Mapping its root zone as a no-go for nightshades.', tag: 'water', water: { kind: 'juglone', cx: 32, cy: 30, r: 27 } },
  { text: 'Currant in the pecan\'s afternoon shade — it actually fruits better out of harsh sun, and uses space nothing else wants.', tag: 'shrub', plant: { name: 'Currant', key: 'shrub', x: 16, y: 20, spread: 7 } },
  { text: 'Comfrey ringing the pecan\'s base. Its deep roots mine minerals and the leaves chop-and-drop into mulch — a nutrient pump for the whole guild.', tag: 'herb', plant: { name: 'Comfrey', key: 'herb', x: 38, y: 44, spread: 6 } },
  { text: 'Mulberry on the NE side, drinking from the rain garden. Fast shade plus heavy fruit.', tag: 'canopy', plant: { name: 'Mulberry', key: 'canopy', x: 66, y: 24, spread: 14 } },
  { text: 'Elderberry at the rain garden\'s edge — it loves wet feet. ⚠ Heads up: raw elderberry leaves and stems are toxic, so I\'m flagging it since you have a dog — keep it out of the play zone.', tag: 'shrub', warn: true, plant: { name: 'Elderberry', key: 'shrub', x: 76, y: 40, spread: 8 } },
  { text: 'Echinacea in the sunny middle. A pollinator magnet — it pulls in the bees your fruit set depends on.', tag: 'herb', plant: { name: 'Echinacea', key: 'herb', x: 50, y: 52, spread: 4 } },
  { text: 'Now the annual veg. Tomatoes you\'ll tend daily go in tidy rows in the sunny SE — easy to pick, and well clear of the pecan\'s juglone zone.', tag: 'veg', bed: { name: 'Tomatoes', x: 74, y: 64, cols: 4, rows: 2 } },
  { text: 'Grape on the SE trellis — climbs vertical space we\'d otherwise waste, in full sun.', tag: 'vine', plant: { name: 'Grape', key: 'vine', x: 90, y: 54, spread: 5 } },
  { text: 'Strawberry as an edible groundcover along the front path. A crop and a living mulch in one.', tag: 'ground', plant: { name: 'Strawberry', key: 'ground', x: 30, y: 78, spread: 4 } },
  { text: 'Dutch clover threads the open ground. It fixes nitrogen from the air and feeds every neighbor for free.', tag: 'ground', plant: { name: 'Clover', key: 'ground', x: 50, y: 64, spread: 15 } },
  { text: 'The pattern: tall to short, water uphill of thirsty roots, toxins mapped, daily harvests within reach. Returning the layout as structured JSON.' },
];

const STEP_MS = 1500;
const LOOP_PAUSE_MS = 5200;

// neighbor lots + the tilted property boundary (static)
const BOUNDARY = '30,6 94,24 76,94 8,70';
const NEIGHBORS = ['-6,-6 26,2 6,40 -16,30', '92,-8 120,18 100,40 84,16', '70,96 104,80 120,116 80,124'];

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
  const plants = steps.flatMap(s => s.plant ? [s.plant] : []);
  const beds = steps.flatMap(s => s.bed ? [s.bed] : []);
  const waters = steps.flatMap(s => s.water ? [s.water] : []);
  const usedLayers = Array.from(new Set(steps.flatMap(s => s.tag ? [s.tag] : [])));

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
              <div key={i} className={`replay-line${s.warn ? ' replay-line-warn' : ''}`}>
                <span className="replay-caret">{s.warn ? <AlertTriangle size={13} /> : '›'}</span>
                <span>
                  {s.text}
                  {s.tag && (
                    <span className="replay-tag" style={{ background: LAYER[s.tag].color }}>{LAYER[s.tag].layer}</span>
                  )}
                </span>
              </div>
            ))}
            {!done && <div className="replay-thinking"><span /><span /><span /></div>}
          </div>
        </div>

        {/* Property map — drawn the way the real app renders a site */}
        <div className="replay-map" aria-label="Property map of the food forest being designed">
          <div className="replay-compass">N ↑</div>
          <div className="replay-sun">☀️ <span>full sun S</span></div>
          <div className="replay-yard">
            <svg className="replay-mapsvg" viewBox="0 0 100 100" aria-hidden="true">
              {/* neighbor lots + lot boundary */}
              {NEIGHBORS.map((p, i) => <polygon key={i} points={p} className="rm-neighbor" />)}
              <polygon points={BOUNDARY} className="rm-boundary" />

              {/* water under canopy so the green tints over it, like the app */}
              {waters.map((w, i) => {
                if (w.kind === 'swale') return <path key={i} d={w.d} className="rm-swale" />;
                if (w.kind === 'pond') return <ellipse key={i} cx={w.cx} cy={w.cy} rx={w.rx} ry={w.ry} className="rm-pond" />;
                return null;
              })}

              {/* canopy spreads */}
              {plants.map(p => (
                <circle key={`c-${p.name}`} cx={p.x} cy={p.y} r={p.spread}
                  className="rm-canopy" style={{ fill: LAYER[p.key].color, stroke: LAYER[p.key].color }} />
              ))}

              {/* juglone exclusion ring, drawn above canopy so it's legible */}
              {waters.filter((w): w is Extract<Water, { kind: 'juglone' }> => w.kind === 'juglone').map((w, i) => (
                <g key={`j-${i}`}>
                  <circle cx={w.cx} cy={w.cy} r={w.r} className="rm-juglone" />
                  <text x={w.cx} y={w.cy - w.r + 4} className="rm-juglone-label">⚠ no nightshades</text>
                </g>
              ))}

              {/* house footprint */}
              <rect x="38" y="64" width="24" height="20" className="rm-house2" />
              <circle cx="50" cy="74" r="1.4" className="rm-house-dot" />

              {/* veg rows */}
              {beds.map(b => (
                <g key={`b-${b.name}`} className="rm-bed">
                  <rect x={b.x - b.cols * 1.8} y={b.y - b.rows * 1.8} width={b.cols * 3.6} height={b.rows * 3.6} rx="1.5" className="rm-bed-box" />
                  {Array.from({ length: b.rows }).flatMap((_, r) =>
                    Array.from({ length: b.cols }).map((__, c) => (
                      <circle key={`${r}-${c}`} r="1.2"
                        cx={b.x - (b.cols - 1) * 1.8 + c * 3.6}
                        cy={b.y - (b.rows - 1) * 1.8 + r * 3.6}
                        className="rm-veg-dot" />
                    )))}
                  <text x={b.x} y={b.y + b.rows * 1.8 + 4} className="rm-label">{b.name}</text>
                </g>
              ))}

              {/* plant center points + labels (above everything) */}
              {plants.map(p => (
                <g key={`p-${p.name}`} className="rm-plant">
                  <circle cx={p.x} cy={p.y} r="1.3" className="rm-dot" />
                  <text x={p.x} y={p.y - 2.6} className="rm-label">{p.name}</text>
                </g>
              ))}
            </svg>
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
