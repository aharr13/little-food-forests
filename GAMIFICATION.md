# 🌱 Little Food Forests — Gamification & XP System (Build Guide)

A complete, code-ready spec for levels, XP, and achievements. Content (titles,
XP, achievements) is the canonical source; the engineering sections show exactly
how to wire it into the existing app.

---

## 0. How this fits the existing code

The app already has XP plumbing — we're building the progression layer on top:

| Already exists | Where | Use for gamification |
|---|---|---|
| `PlantingTask.xpReward` / `xpEarned` | `types.ts`, set in `completeStep` (`usePlantingTasks`) | XP from completing planting steps |
| `CareItem.xpPerCompletion` / `totalXpEarned` | `types.ts`, `useCareItems.completeItem` | XP from watering/care completions |
| `totalXp` display | `PlanningScreen` header (`Trophy … {totalXp} XP`) | Replace with level/XP bar |

**New pieces to add:** a level table, an achievements catalog, a persistent
per-user gamification record (`totalXp`, earned achievements, streak), an award
engine, and UI (XP bar + achievements gallery + unlock toasts).

**XP model (recommended):**
```
totalXp = Σ task.xpEarned (all projects)
        + Σ careItem.totalXpEarned (all projects)
        + Σ earnedAchievement.xp
level  = highest LEVELS[].xpRequired ≤ totalXp
```
Compute `totalXp` (don't hand-increment) so it can never drift. Store the
*result* + earned achievement ids on the user so it survives reloads.

---

## 1. Data model (TypeScript)

```ts
// src/data/levels.ts
export interface Level { level: number; title: string; xpRequired: number; }

// src/data/achievements.ts
export type AchievementTrigger = 'auto' | 'claim';
export interface Achievement {
  id: string;                 // stable kebab id, never reused
  name: string;               // punny display name
  description: string;        // what the player did
  xp: number;
  category: AchievementCategory;
  trigger: AchievementTrigger; // 'auto' = awarded by an app event; 'claim' = user taps "I did this"
  metric?: string;            // for 'auto': which counter/event drives it (see §4)
  threshold?: number;         // for 'auto': count needed (default 1)
}
export type AchievementCategory =
  | 'basics' | 'food' | 'compost' | 'mycology' | 'ecosystem';

// src/types.ts (persisted on the user)
export interface UserGamification {
  totalXp: number;
  level: number;
  earnedAchievementIds: string[];
  earnedAt: Record<string, string>; // achievementId -> ISO date
  // streak tracking (for "Tending the Flock" etc.)
  lastCheckInDate?: string;          // yyyy-mm-dd
  currentStreak: number;
  longestStreak: number;
}
```

Persist `UserGamification` at `users/{uid}` (e.g. a `gamification` map field) so
level/title/achievements are account-wide. The existing `users/{uid}` rule
(owner read/write) already covers it.

---

## 2. The Leveling System — 50 Titles & XP Thresholds

`xpRequired` is the **cumulative** total XP needed to *reach* that level.

```ts
export const LEVELS: Level[] = [
  { level: 1,  title: 'Couch Potato',                xpRequired: 0 },
  { level: 2,  title: 'Innocent Sprout',             xpRequired: 50 },
  { level: 3,  title: 'Dirt Dabbler',                xpRequired: 120 },
  { level: 4,  title: 'Seed Slinger',                xpRequired: 200 },
  { level: 5,  title: 'Mulch Ado About Nothing',     xpRequired: 300 },
  { level: 6,  title: 'Weed Whacker',                xpRequired: 420 },
  { level: 7,  title: 'Compost Connoisseur',         xpRequired: 550 },
  { level: 8,  title: 'Worm Wrangler',               xpRequired: 700 },
  { level: 9,  title: 'Vigilante Gardener',          xpRequired: 870 },
  { level: 10, title: 'Branch Manager',              xpRequired: 1050 },
  { level: 11, title: 'Shrub Sub',                   xpRequired: 1250 },
  { level: 12, title: 'Berry Good Planter',          xpRequired: 1470 },
  { level: 13, title: 'Fungi Fanatic',               xpRequired: 1710 },
  { level: 14, title: 'Soil Mate',                   xpRequired: 1970 },
  { level: 15, title: 'Photosynthesis Phreak',       xpRequired: 2250 },
  { level: 16, title: 'Vine Vindicator',             xpRequired: 2550 },
  { level: 17, title: 'Pruning Pro',                 xpRequired: 2870 },
  { level: 18, title: 'Trowel Blazer',               xpRequired: 3210 },
  { level: 19, title: 'Barking Up the Right Tree',   xpRequired: 3570 },
  { level: 20, title: 'Hoe-Down Hero',               xpRequired: 3950 },
  { level: 21, title: 'Rooting For You',             xpRequired: 4350 },
  { level: 22, title: 'The Plant Whisperer',         xpRequired: 4770 },
  { level: 23, title: 'Chief of Chives',             xpRequired: 5210 },
  { level: 24, title: 'Melon-Collie Curer',          xpRequired: 5670 },
  { level: 25, title: 'The Big Dill',                xpRequired: 6150 },
  { level: 26, title: 'Lord of the Loam',            xpRequired: 6500 },
  { level: 27, title: 'Baron of Botany',             xpRequired: 7100 },
  { level: 28, title: 'The Green Thumb',             xpRequired: 7750 },
  { level: 29, title: 'Leaf Peeping Legend',         xpRequired: 8450 },
  { level: 30, title: 'Canopy Captain',              xpRequired: 9200 },
  { level: 31, title: 'Fungal Philosopher',          xpRequired: 10000 },
  { level: 32, title: 'Spore Sorcerer',              xpRequired: 10850 },
  { level: 33, title: 'The Fruitful Friar',          xpRequired: 11750 },
  { level: 34, title: 'Orchard Oracle',              xpRequired: 12700 },
  { level: 35, title: 'Master of Mycelium',          xpRequired: 13700 },
  { level: 36, title: 'Duke of Dirt',                xpRequired: 14750 },
  { level: 37, title: 'Sultan of Soil',              xpRequired: 15850 },
  { level: 38, title: 'The Regenerator',             xpRequired: 17000 },
  { level: 39, title: 'Bio-Char Boss',               xpRequired: 18200 },
  { level: 40, title: 'Pollinator Paladin',          xpRequired: 19450 },
  { level: 41, title: 'Flora Pharaoh',               xpRequired: 20750 },
  { level: 42, title: 'Ecosystem Emperor',           xpRequired: 22100 },
  { level: 43, title: 'Queen/King of the Crop',      xpRequired: 23500 },
  { level: 44, title: "Mother Nature's Minion",      xpRequired: 24950 },
  { level: 45, title: 'Shroom Sage',                 xpRequired: 26450 },
  { level: 46, title: 'Grandmaster Graft',           xpRequired: 28000 },
  { level: 47, title: 'Supreme Sprout',              xpRequired: 29600 },
  { level: 48, title: 'Forest Sovereign',            xpRequired: 31250 },
  { level: 49, title: 'Steward of the Earth',        xpRequired: 32950 },
  { level: 50, title: 'The Omnipotent Oak',          xpRequired: 35000 },
];
```

**Level helpers:**
```ts
// src/utils/gamification.ts
import { LEVELS } from '../data/levels';

export function getLevel(totalXp: number): Level {
  let cur = LEVELS[0];
  for (const l of LEVELS) { if (totalXp >= l.xpRequired) cur = l; else break; }
  return cur;
}
export function getNextLevel(totalXp: number): Level | null {
  return LEVELS.find(l => l.xpRequired > totalXp) ?? null; // null = max level
}
// 0..1 progress through the current level, for the XP bar
export function levelProgress(totalXp: number): number {
  const cur = getLevel(totalXp);
  const next = getNextLevel(totalXp);
  if (!next) return 1;
  return (totalXp - cur.xpRequired) / (next.xpRequired - cur.xpRequired);
}
```

---

## 3. Achievements catalog (50)

```ts
export const ACHIEVEMENTS: Achievement[] = [
  // ── Getting Your Hands Dirty (Basics) ───────────────────────────────
  { id: 'sow-seeds-of-love',  name: 'Sowing the Seeds of Love', description: 'Plant your first seed.', xp: 50,  category: 'basics', trigger: 'auto',  metric: 'plantsPlaced', threshold: 1 },
  { id: 'dirty-deeds',        name: 'Dirty Deeds Done Dirt Cheap', description: 'Add soil or amendments to your first bed.', xp: 50, category: 'basics', trigger: 'claim' },
  { id: 'water-you-doing',    name: 'Water You Doing?', description: 'Log your first watering session.', xp: 50, category: 'basics', trigger: 'auto', metric: 'wateringCompletions', threshold: 1 },
  { id: 'weed-it-and-weep',   name: 'Weed It and Weep', description: 'Pull your first 100 weeds.', xp: 100, category: 'basics', trigger: 'claim' },
  { id: 'can-you-dig-it',     name: 'Can You Dig It?', description: 'Prepare a new garden tier or swale.', xp: 150, category: 'basics', trigger: 'auto', metric: 'waterFeaturesPlaced', threshold: 1 },
  { id: 'say-aloe',           name: 'Say Aloe to My Little Friend', description: 'Plant a succulent or medicinal herb.', xp: 150, category: 'basics', trigger: 'claim' },
  { id: 'tending-the-flock',  name: 'Tending the Flock', description: 'Log 30 consecutive days of garden check-ins.', xp: 400, category: 'basics', trigger: 'auto', metric: 'currentStreak', threshold: 30 },
  { id: 'mulch-ado',          name: 'Mulch Ado About Nothing', description: 'Spread your first layer of wood chips or mulch.', xp: 100, category: 'basics', trigger: 'auto', metric: 'mulchStepsCompleted', threshold: 1 },
  { id: 'carrot-and-stick',   name: 'Carrot and Stick', description: 'Build your first garden trellis from foraged branches.', xp: 250, category: 'basics', trigger: 'claim' },
  { id: 'turnip-the-beet',    name: 'Turnip the Beet', description: 'Play music for your plants (or just a playlist while working).', xp: 50, category: 'basics', trigger: 'claim' },

  // ── Fruits, Veggies, & Herbs ────────────────────────────────────────
  { id: 'you-grow',           name: 'You Grow Girl/Guy', description: 'Successfully harvest your first vegetable.', xp: 200, category: 'food', trigger: 'claim' },
  { id: 'wood-you-believe',   name: 'Wood You Believe It?', description: 'Plant your first fruit tree.', xp: 300, category: 'food', trigger: 'auto', metric: 'fruitTreesPlaced', threshold: 1 },
  { id: 'berry-good-job',     name: 'Berry Good Job', description: 'Harvest 5 pounds of berries.', xp: 250, category: 'food', trigger: 'claim' },
  { id: 'thyme-on-my-side',   name: 'Thyme is on My Side', description: 'Grow 5 different culinary herbs.', xp: 200, category: 'food', trigger: 'auto', metric: 'distinctHerbs', threshold: 5 },
  { id: 'beet-it',            name: 'Beet It', description: 'Harvest your first root vegetable.', xp: 100, category: 'food', trigger: 'claim' },
  { id: 'squash-competition', name: 'Squash the Competition', description: 'Grow a squash weighing over 5 lbs.', xp: 250, category: 'food', trigger: 'claim' },
  { id: 'peas-and-quiet',     name: 'Peas and Quiet', description: 'Trellis your first climbing plant.', xp: 150, category: 'food', trigger: 'auto', metric: 'vinesPlaced', threshold: 1 },
  { id: 'tomatoes',           name: 'To-Ma-Toes, To-Mah-Toes', description: 'Harvest 10 homegrown tomatoes.', xp: 150, category: 'food', trigger: 'claim' },
  { id: 'let-us-romaine',     name: 'Let Us Romaine Friends', description: 'Plant a dedicated salad bed.', xp: 150, category: 'food', trigger: 'claim' },
  { id: 'kale-yeah',          name: 'Kale Yeah!', description: 'Successfully grow a leafy green through the winter.', xp: 200, category: 'food', trigger: 'claim' },

  // ── Compost & Soil Biology ──────────────────────────────────────────
  { id: 'compost-modernism',  name: 'Compost-modernism', description: 'Start your first compost pile.', xp: 150, category: 'compost', trigger: 'claim' },
  { id: 'worming-your-way-in',name: 'Worming Your Way In', description: 'Add vermicomposting (worms) to your setup.', xp: 200, category: 'compost', trigger: 'claim' },
  { id: 'a-peeling-process',  name: 'A Peeling Process', description: 'Add 50 banana peels or kitchen scraps to the compost.', xp: 150, category: 'compost', trigger: 'claim' },
  { id: 'nitrogen-fixation',  name: 'Nitrogen Fixation', description: 'Plant beans, peas, or clover specifically to enrich the soil.', xp: 200, category: 'compost', trigger: 'auto', metric: 'nitrogenFixersPlaced', threshold: 1 },
  { id: 'busting-your-chops', name: 'Busting Your Chops', description: 'Chop and drop your first cover crop.', xp: 250, category: 'compost', trigger: 'claim' },
  { id: 'guano-get-crazy',    name: 'Guano Get Crazy', description: 'Utilize natural fertilizers like bat guano or fish emulsion.', xp: 150, category: 'compost', trigger: 'claim' },
  { id: 'soil-food-webmaster',name: 'Soil Food Webmaster', description: 'Achieve excellent soil biology metrics on a soil test.', xp: 500, category: 'compost', trigger: 'claim' },
  { id: 'cover-your-bases',   name: 'Cover Your Bases', description: 'Plant a living ground cover instead of using bare soil.', xp: 200, category: 'compost', trigger: 'auto', metric: 'groundcoverPlaced', threshold: 1 },
  { id: 'black-gold-rush',    name: 'Black Gold Rush', description: 'Harvest your first batch of finished compost.', xp: 300, category: 'compost', trigger: 'claim' },
  { id: 'teaming-with-microbes', name: 'Teaming with Microbes', description: 'Brew and apply your first compost tea.', xp: 350, category: 'compost', trigger: 'claim' },

  // ── Mycology & Mushrooms ────────────────────────────────────────────
  { id: 'fun-guy',            name: 'Fun-Guy to Be Around', description: 'Harvest your first batch of edible mushrooms.', xp: 250, category: 'mycology', trigger: 'claim' },
  { id: 'mycelium-millennium',name: 'Mycelium Millennium', description: 'Establish a thriving mushroom bed on the forest floor.', xp: 400, category: 'mycology', trigger: 'auto', metric: 'rhizospherePlaced', threshold: 1 },
  { id: 'fungus-among-us',    name: 'The Fungus Among Us', description: 'Forage or inoculate 5 different mushroom logs.', xp: 400, category: 'mycology', trigger: 'claim' },
  { id: 'fairy-ring-leader',  name: 'Fairy Ring Leader', description: 'Discover or cultivate a ring of mushrooms.', xp: 350, category: 'mycology', trigger: 'claim' },
  { id: 'spore-tactics',      name: 'Spore Tactics', description: 'Take a spore print from a harvested mushroom.', xp: 150, category: 'mycology', trigger: 'claim' },

  // ── Ecosystem & Advanced Techniques ─────────────────────────────────
  { id: 'rooting-for-you',    name: 'Rooting For You', description: 'Propagate a new plant from a cutting.', xp: 200, category: 'ecosystem', trigger: 'claim' },
  { id: 'i-will-survive',     name: 'I Will Survive', description: 'Revive a wilting or diseased plant.', xp: 150, category: 'ecosystem', trigger: 'claim' },
  { id: 'dont-stop-be-leafing',name: "Don't Stop Be-Leafing", description: 'Successfully overwinter a tender plant.', xp: 300, category: 'ecosystem', trigger: 'claim' },
  { id: 'foliage-foolishness',name: 'Foliage and Foolishness', description: 'Do your first seasonal tree pruning.', xp: 150, category: 'ecosystem', trigger: 'claim' },
  { id: 'bee-my-guest',       name: 'Bee My Guest', description: 'Spot your first pollinator on a flower you planted.', xp: 100, category: 'ecosystem', trigger: 'claim' },
  { id: 'bugging-out',        name: 'Bugging Out', description: 'Introduce beneficial insects (ladybugs, nematodes).', xp: 200, category: 'ecosystem', trigger: 'claim' },
  { id: 'no-harm-no-fowl',    name: 'No Harm, No Fowl', description: 'Integrate chickens or ducks into the ecosystem.', xp: 500, category: 'ecosystem', trigger: 'claim' },
  { id: 'a-seed-is-born',     name: 'A Seed is Born', description: 'Save seeds from a harvest to plant next year.', xp: 300, category: 'ecosystem', trigger: 'claim' },
  { id: 'grafting-crazy',     name: 'Grafting Crazy', description: 'Successfully graft a fruiting branch onto rootstock.', xp: 500, category: 'ecosystem', trigger: 'claim' },
  { id: 'mint-condition',     name: 'Mint Condition', description: 'Contain a mint plant before it takes over the yard.', xp: 300, category: 'ecosystem', trigger: 'claim' },
  { id: 'perennial-pro',      name: 'Perennial Professional', description: 'Plant 10 different perennial food sources.', xp: 400, category: 'ecosystem', trigger: 'auto', metric: 'distinctPerennials', threshold: 10 },
  { id: 'out-on-a-limb',      name: 'Out on a Limb', description: 'Harvest fruit while standing on a tree ladder.', xp: 150, category: 'ecosystem', trigger: 'claim' },
  { id: 'chive-talkin',       name: "Chive Talkin'", description: 'Share a basket of your harvest with a neighbor or friend.', xp: 250, category: 'ecosystem', trigger: 'claim' },
  { id: 'treat-yourself',     name: 'Tree-t Yourself', description: 'Eat fruit straight from the branch.', xp: 100, category: 'ecosystem', trigger: 'claim' },
  { id: 'eden-reborn',        name: 'Eden Reborn', description: 'Fully establish all 7 food-forest layers.', xp: 2000, category: 'ecosystem', trigger: 'auto', metric: 'distinctLayersWithEstablished', threshold: 7 },
];
```

---

## 4. Auto-trigger metrics → app events

This is a *design/planning* app, not a sensor — so most achievements are
**`claim`** (a one-tap "I did this!" button in the gallery). The **`auto`** ones
map to data we already have. Compute these metrics from `shapes` + tasks + care:

| `metric` | How to compute (from app state) |
|---|---|
| `plantsPlaced` | `shapes.filter(s => s.plantName).length` |
| `fruitTreesPlaced` | shapes in `canopy`/`understory` whose plant `edible` and is a tree |
| `vinesPlaced` | `shapes.filter(s => s.layerId === 'vine' && s.plantName)` |
| `groundcoverPlaced` | `shapes.filter(s => s.layerId === 'groundcover' && s.plantName)` |
| `rhizospherePlaced` | `shapes.filter(s => s.layerId === 'rhizosphere' && s.plantName)` |
| `nitrogenFixersPlaced` | shapes whose plant `guildFunctions` includes `nitrogen-fixer` |
| `waterFeaturesPlaced` | `waterFeatures.length` |
| `distinctHerbs` | distinct plant names among `herbaceous` shapes (≥5) |
| `distinctPerennials` | distinct plant names tagged perennial / woody layers |
| `distinctLayersWithEstablished` | distinct `layerId` among shapes with `status === 'established'` |
| `wateringCompletions` | count of care completions where title matches `/water/i` |
| `mulchStepsCompleted` | planting steps with `/mulch/i` in title that are `completed` |
| `currentStreak` | from `UserGamification.currentStreak` (check-in tracking) |

> Plant lookups (edible/guildFunctions/perennial) join `shapes` → the plant DB
> (`usePlants`), same pattern as the advisor's guild analysis.

**Streak ("Tending the Flock"):** on each app open, if `lastCheckInDate` is
yesterday → `currentStreak++`; if today → no-op; otherwise reset to 1. Update
`longestStreak`. Store on `UserGamification`.

---

## 5. Award engine

```ts
// src/utils/gamification.ts
export interface AwardContext {
  metrics: Record<string, number>;     // computed per §4
  earnedAchievementIds: Set<string>;
}

// Returns newly-unlocked AUTO achievements (not previously earned).
export function evaluateAutoAchievements(ctx: AwardContext): Achievement[] {
  return ACHIEVEMENTS.filter(a =>
    a.trigger === 'auto' &&
    !ctx.earnedAchievementIds.has(a.id) &&
    (ctx.metrics[a.metric ?? ''] ?? 0) >= (a.threshold ?? 1)
  );
}
```

- Run `evaluateAutoAchievements` whenever `shapes`/tasks/care change (debounced),
  and on app open (for streak-based ones).
- For each newly-unlocked: add id to `earnedAchievementIds`, set `earnedAt`,
  fire an **unlock toast**, and recompute `totalXp` → `level`. If the level
  increased, fire a **level-up celebration**.
- **Idempotency:** never award an id already in `earnedAchievementIds`. `claim`
  achievements are unlocked by a button that does the same add + toast.

**Recompute total + level after any change:**
```ts
const achievementXp = [...earnedAchievementIds]
  .reduce((n, id) => n + (ACHIEVEMENTS.find(a => a.id === id)?.xp ?? 0), 0);
const totalXp = taskXp + careXp + achievementXp;
const level = getLevel(totalXp).level;
// persist { totalXp, level, earnedAchievementIds, earnedAt, streak… } to users/{uid}
```

---

## 6. UI components

1. **XP bar + title** (replace the plain `… XP` in the header):
   - Big title (`getLevel(totalXp).title`), `Lvl {level}`, a progress bar
     (`levelProgress`), and `{totalXp} / {nextLevel.xpRequired} XP`.
   - At max level show "MAX — The Omnipotent Oak 🌳".
2. **Achievements gallery** (new tab in the planning view, beside Tasks/Calendar):
   - Grouped by `category`. Earned = full color + date; locked = greyed with the
     hint. `claim` cards show a "Mark complete (+{xp} XP)" button.
   - Show "{earned}/50 unlocked · {achievementXp} XP from achievements".
3. **Unlock toast** — slide-in: "🏆 Achievement unlocked — {name} (+{xp} XP)".
4. **Level-up celebration** — full-width banner + confetti (reuse the existing
   confetti in `LayersScreen`): "LEVEL {n}! You are now a {title}".

---

## 7. Suggested build order

1. `data/levels.ts`, `data/achievements.ts`, `utils/gamification.ts` (pure, testable).
2. `useGamification(uid)` hook — loads/persists `UserGamification` from `users/{uid}`; exposes `totalXp`, `level`, `earnedAchievementIds`, `claim(id)`, and a `refresh(metrics, taskXp, careXp)` that re-evaluates + saves.
3. Compute metrics (§4) in App from `shapes`/`usePlants`/tasks/care; call `refresh` on change (debounced) + on open (streak).
4. XP bar + title in the header.
5. Achievements gallery tab.
6. Toasts + level-up celebration.

---

## 8. Extra punny title pool (swap-ins / expansion)

More options as requested — mix & match, or use for seasonal/prestige tiers:

**Beginner-ish:** Spud Muffin · Greenhorn Gardener · Sprout About It · Bud-ding
Beginner · Fern-tastic Newbie · Leaf it to Me · Petal to the Metal · Soil Searcher ·
Rookie of the Soil · Trowel and Error · Seedy Character · Lawn Ranger · Plant Parenthood

**Mid-game:** Herb Your Enthusiasm · Fronds with Benefits · Sage Against the Machine ·
Drought Defier · The Loam Ranger · Bean Counter · Squash Buckler · Rhi-zo-master ·
Compost Malone · Bed Head (Raised-Bed Boss) · Pollin-nation Builder · Tilth Wielder ·
Humus Sapien · The Underground King (roots/rhizosphere) · Frondly Neighbor

**Mycology line:** Spore Loser (ironic early) · Mush-room for Improvement · Hyphae Five ·
The Decomposer · Mold-en Child · Cap-tain Mycelium · Truffle Shuffle · Net-work Admin
(mycorrhizal) · Fungal Overlord

**Late-game / prestige:** The Permaculture Prophet · Guild Master · Keeper of the Canopy ·
Sultan of Succession · The Soil Sovereign · Archdruid of Acreage · Lord Voldemort-iculture ·
The Final Frontier(yard) · One With the Loam · Photosynthe-sized & Certified ·
Heir to the Orchard · The Compost Whisperer · Mulch Walberg · Sir Plants-a-Lot ·
Her Royal Highness of Hugelkultur · The Tree-mendous · Captain Planet's Successor ·
Eternal Steward

**Funny "honorable mention" tiers:** Certified Plant Killer (early redemption arc) ·
Reformed Black Thumb · Professional Procrasti-gardener · Weekend Worrier (warrior) ·
Overwaterer Anonymous · The Optimistic Over-planter

---

*Tuning notes:* XP curve totals ~35k to hit max. With planting steps (~75 XP/plant)
+ daily watering (~5 XP) + achievements, a committed gardener reaches the mid-30s
of levels over a real season — keep that pacing in mind if you add XP sources.
