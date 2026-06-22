# 🌳 Little Food Forests

**Design a permaculture food forest on a real map — with Claude as the design engine.**

Map your property, tell the AI advisor what you want to grow, and it lays out a
complete 7-layer permaculture guild (canopy → groundcover), reasoning about sun,
soil, and companion planting. Then plan the planting, track watering, and build
photo time-lapses as the forest grows.

> **Live demo:** **[little-food-forests.web.app](https://little-food-forests.web.app)**
> **Stack:** React 19 · TypeScript · Vite · Firebase (Auth/Firestore/Storage/Functions) · Leaflet · Anthropic Claude

---

## Why this exists

Permaculture food-forest design is genuinely hard: you're stacking 7 vertical
layers of plants into mutually-beneficial *guilds*, on a specific site, with real
constraints (sun aspect, water, mature spread, companion relationships). It's the
kind of spatial, multi-constraint reasoning problem that's tedious for a person
and a great fit for an LLM. This app makes Claude the planner and gives it a real
canvas to act on.

## How Claude is used (the interesting part)

Claude isn't a chat widget bolted to the side — it's the design engine, wired in
like a production system.

**1. Secure by construction.** The Anthropic API key never reaches the browser.
Every call goes through an authenticated Firebase Cloud Function that enforces a
model allowlist and a hard output-token ceiling — see
[`functions/index.js`](functions/index.js):

```js
const ALLOWED_MODELS = new Set(['claude-opus-4-8', 'claude-haiku-4-5-20251001']);

exports.claudeProxy = onCall({ secrets: [ANTHROPIC_API_KEY] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  if (!ALLOWED_MODELS.has(request.data.model)) throw new HttpsError('invalid-argument');
  const max_tokens = Math.min(request.data.max_tokens, MAX_TOKENS_CAP);
  // ...calls Claude with the server-held key and returns text
});
```

**2. Structured, spatial output.** The advisor is handed the *live map state* —
which of the 7 layers are covered, where the guild gaps are, sun aspect — and
returns JSON plant placements that render straight onto the Leaflet canvas.
Reasoning in, geometry out. (`src/components/Consultation/`,
`src/utils/` placement logic.)

**3. A knowledge base that expands itself.** When the plant database is missing a
species, Claude researches it and writes a structured record on demand, so the
app's catalog grows as it's used ([`src/utils/generatePlants.ts`](src/utils/generatePlants.ts)).

The landing page ships a deterministic **replay** of a real design session
(reasoning streams in while plants drop onto a mini-map) so anyone can see this
without signing in or spending a token — see
[`src/components/Landing/ClaudeReplay.tsx`](src/components/Landing/ClaudeReplay.tsx).

## Features

- **Map-based design** — geocode an address, trace your boundary on satellite
  imagery, place plants with true-to-scale canopy spreads.
- **AI auto-layout** — Claude places an entire plant list into a coherent guild.
- **Planning + gamification** — season-aware planting/watering schedules and a
  50-level progression system.
- **Field photo time-lapse** — drop photo anchor points, shoot from the same spot
  over months with a ghost-overlay alignment guide.
- **Installable PWA** — works on a phone, offline-capable.

## Architecture

```
React (Vite, TS)  ──►  Firebase Auth ──► Firestore (projects, plants, tasks, photos)
       │                                  Storage  (field photos)
       │
       └─ httpsCallable ──► Cloud Function `claudeProxy` ──► Anthropic API
                            (key as a server secret, model allowlist, token cap)
```

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in Firebase web config + Google Maps key
npm run dev
```

The Anthropic key is **not** an env var — it's a server-side Firebase secret:

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase deploy --only functions
```

## Deploy

```bash
npm run build
firebase deploy --only hosting,functions,firestore:rules,storage:rules
```

## Project layout

| Path | What |
|------|------|
| `src/components/Landing/` | Public marketing page + the Claude replay demo |
| `src/components/Canvas/`  | Map drawing, layers, plant placement |
| `src/components/Consultation/` | The Claude advisor (chat + structured placements) |
| `src/components/Planning/` | Planting/watering schedules, XP, levels |
| `src/components/Photo/`    | Field camera + time-lapse galleries |
| `functions/index.js`       | Server-side Claude proxy |
| `GAMIFICATION.md`          | Design spec for the leveling/achievement system |

## License

MIT — see [LICENSE](LICENSE).
