# Little Food Forests — Wiki Article Writing Prompt

Copy everything below the line and paste it into any AI to generate new wiki articles.
Replace the bracketed [INSTRUCTIONS] at the bottom with what you want written.

---

## CONTEXT: What This Is For

I am building a web app called **Little Food Forests** that helps homeowners in Texas design and grow food forests. The app has:

1. **A map-based design tool** where users place plants in layers (canopy, understory, shrub, herbaceous, groundcover, rhizosphere, vine)
2. **A wiki knowledge base** of educational articles stored in Firestore
3. **An AI garden advisor** (Claude) that reads all wiki articles before every conversation, then uses them as its grounding knowledge when advising users

**This means every article you write will be injected into Claude's context window.** Claude will:
- Reference article titles by name in conversation ("Your wiki covers this in 'Nitrogen Fixers in Texas'")
- Use article content to ground its plant recommendations
- Cite learning activities when teaching concepts
- Use your exact terminology and framing consistently

Write as if you are writing for two audiences simultaneously:
1. A homeowner reading the article in the wiki (educational, encouraging, practical)
2. Claude reading it as a knowledge document (precise, structured, scannable)

---

## THE EXISTING ARTICLE LIBRARY (17 articles already written)

These exist — do NOT rewrite them. New articles should complement and cross-reference them:

| # | Title | Key Topics |
|---|---|---|
| 1 | The Living Soil (The Soil Food Web) | Mycorrhizal fungi, glomalin, organic matter, mulching, composting |
| 2 | Site Assessment (Reading the Land) | Topography, solar exposure, sectors, wind, wildlife corridors, frost pockets |
| 3 | The Vertical Harvest (The 7 Layers) | Canopy/understory/shrub/herbaceous/groundcover/rhizosphere/vine, light management, root niches |
| 4 | Water Literacy (Earthworks & Passive Hydrology) | Swales, berms, rain gardens, infiltration, soil organic matter |
| 5 | The Support Guild (Companion Planting) | Nitrogen fixers, insectary plants, dynamic accumulators, pest confusers |
| 6 | Wildlife & Pollinators (The Living Security) | Pollinators, pest controllers, decomposers, habitat creation |
| 7 | The Art of Pruning (Chop & Drop) | Chop-and-drop mulching, pruning timing, biomass |
| 8 | Food Forest Design (Patterns & Paths) | Design patterns, access paths, zones |
| 9 | Successional Harvesting (The Long Game) | Succession planning, long-term yield, patience |
| 10 | Protecting the Fungal Layer | Mycorrhizal protection, no-till, woodchips |
| 11 | The Nurse Layer (Micro-climates) | Nurse plants, microclimates, establishment protection |
| 12 | Moss as a Biological Sponge | Moss groundcover, moisture retention |
| 13 | Hydrology & The Sponge Strategy | Water infiltration, landscape as sponge |
| 14 | Living Mulches (The Green Blanket) | Clover, living mulch species, weed suppression |
| 15 | The Rhizosphere (Root Communication) | Root exudates, underground communication, root crops |
| 16 | Living Fences (Hedgerows & Fedges) | Hedgerow design, wildlife corridors, fedge species |
| 17 | Infinite Abundance (Propagation & Willow Water) | Cuttings, willow water, division, seed saving |

---

## EXACT JSON FORMAT REQUIRED

All articles must be delivered as valid JSON matching this structure exactly.
This JSON is appended to `wiki-import/articles.json` and imported to Firestore via a Node.js script.

```json
{
  "order": 18,
  "id": "article-18-your-slug-here",
  "title": "Your Article Title 🌱",
  "image_path": null,
  "summary": "One or two sentences. This appears in the wiki listing and in Claude's context as the article description. Make it specific and informative, not vague.",
  "content": "### Section Heading One\n\n* **Bold Term:** Explanation of the term. Keep bullet points punchy — one key idea each.\n* **Bold Term:** Explanation.\n\n### Section Heading Two\n\nParagraph text can go here for narrative sections.\n\n* **Item:** Detail.\n\n### Texas Context 🌵\n\n* **Species List:** Always include a bulleted list of Texas-appropriate species with their common name, scientific name in parentheses, and one sentence on why it works in Texas.\n* **Planting Window:** Month ranges for Central Texas. Note regional variations (South Texas, East Texas, Hill Country, West Texas) where relevant.\n* **Watch Out For:** One or two Texas-specific cautions (heat, alkaline soil, cedar competition, fire ants, deer pressure, etc.)\n\n### In Your Design\n\n* **Tip 1:** A concrete placement or usage tip tied directly to the Little Food Forests app layers.\n* **Tip 2:** Another actionable tip.\n* **Tip 3:** Optional third tip.",
  "learning_activity": {
    "title": "Short Action Title (The Something)",
    "steps": [
      "Action word: First step — specific and physical. Tell them exactly what to do.",
      "Action word: Second step.",
      "Action word: Third step.",
      "Result: What they will observe or learn from completing this activity."
    ]
  },
  "reflective_question": "A single open-ended question that makes the reader think about how this concept applies to their specific situation. Should create a slight 'aha' moment. Not a quiz question — a thinking prompt."
}
```

### Field Rules

| Field | Rules |
|---|---|
| `order` | Increment from the last article (currently 17, so start at 18) |
| `id` | `"article-{order}-{slug}"` where slug uses hyphens, no emojis |
| `title` | Include ONE relevant emoji at the end. Keep under 60 characters. |
| `image_path` | Set to `null` unless you have an image file ready |
| `summary` | 1-2 sentences, 25-40 words. No jargon in the first sentence. |
| `content` | Use `\n\n` between paragraphs, `\n` within lists. All markdown. Min 200 words, max 400 words. |
| `learning_activity.steps` | 3-5 steps. Each starts with an action word followed by a colon. Last step starts with "Result:" |
| `reflective_question` | One question. Ends with `?`. No quotation marks around it. |

---

## CONTENT STANDARDS

### Voice & Tone
- Warm, encouraging, curious — like a knowledgeable gardening mentor
- Write for a beginner who may be intimidated, but don't talk down to experienced gardeners
- Use "we" and "you" naturally — avoid passive voice
- Use the "Yes, and..." principle: affirm before expanding
- Celebrate effort: "Even planting one nitrogen fixer is a meaningful step"

### Structure Pattern (follow this order in `content`):
1. **What is it?** — Plain language, no jargon in first paragraph. One compelling hook sentence.
2. **Why it matters** — Tie to real outcomes: food production, less work, drought resilience, wildlife
3. **Texas Context** — ALWAYS include this section. Regional species, timing, climate cautions.
4. **In Your Design** — How this connects to the app's layers (canopy, guild, groundcover, etc.)

### Texas-Specific Requirements (critical for Claude's usefulness)
Every article MUST include a "Texas Context" section with:
- Named species that thrive in Texas (common name + scientific name)
- Planting windows by season (not just "spring" — give months)
- At minimum one note about: heat/drought tolerance, alkaline soil compatibility, or deer resistance
- Regional variation note when relevant: Central TX (Austin/San Antonio), East TX (piney woods/humidity), South TX (subtropical), Hill Country (rocky/alkaline), West TX (arid)

### What Claude Needs to Do Its Job
Claude reads these articles before advising users. It specifically needs:
- **Named species** it can recommend by name (not "a nitrogen fixer" but "Pigeon Pea (*Cajanus cajan*)")
- **Specific numbers** where possible (planting depths, spacing, timing in months, establishment timeline in months/years)
- **Cause-and-effect language** ("If you do X, then Y happens") — Claude uses this to explain tradeoffs
- **Comparison language** ("Unlike X, Y does...") — helps Claude distinguish options
- **Warning flags** ("Do not plant X near Y because...") — Claude needs to know what to avoid recommending

---

## TAGS (include these in your output for each article)

After the JSON for each article, provide a `tags` line in this format:
```
TAGS: soil, nitrogen-fixer, texas, beginner, establishment
```

Choose 4-8 tags from this list (or add new ones if genuinely needed):
`soil` `fungi` `biology` `mulch` `beginner` `foundation` `site` `observation` `sun` `wind` `water` `design` `layers` `canopy` `understory` `shrub` `groundcover` `guild` `nitrogen-fixer` `insectary` `dynamic-accumulator` `companion` `pollinators` `wildlife` `habitat` `pruning` `chop-and-drop` `maintenance` `technique` `succession` `harvest` `long-term` `planning` `microclimate` `establishment` `rhizosphere` `roots` `underground` `hedgerow` `propagation` `texas` `drought` `alkaline-soil` `deer` `heat` `planting-calendar` `year-1` `beginner` `schedule`

---

## THE IMPORT SCRIPT

After you generate articles, save them appended to `wiki-import/articles.json`, then run this script to import them to Firestore. The script clears ALL existing articles and re-imports the full file, so always keep `articles.json` as the single source of truth.

```javascript
// scripts/import-wiki.mjs
// Run with: node scripts/import-wiki.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  apiKey: 'AIzaSyAJeuUwjHDhC67_y6Z3bzJM88Nwh8QzAbU',
  authDomain: 'little-food-forests.firebaseapp.com',
  projectId: 'little-food-forests',
  storageBucket: 'little-food-forests.firebasestorage.app',
  messagingSenderId: '724137388400',
  appId: '1:724137388400:web:24207d2a08c482609e47b5',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Category mapping — update this when adding new articles
// Categories: 'getting-started' | 'design-principles' | 'plant-science' | 'techniques' | 'maintenance'
const CATEGORY_MAP = {
  1:  'getting-started',    // Living Soil
  2:  'getting-started',    // Site Assessment
  3:  'getting-started',    // 7 Layers
  4:  'design-principles',  // Water Literacy
  5:  'plant-science',      // Support Guild
  6:  'techniques',         // Wildlife & Pollinators
  7:  'techniques',         // Pruning
  8:  'design-principles',  // Design
  9:  'maintenance',        // Successional Harvest
  10: 'techniques',         // Fungal Protection
  11: 'techniques',         // Nurse Layer
  12: 'techniques',         // Moss
  13: 'design-principles',  // Hydrology
  14: 'plant-science',      // Living Mulches
  15: 'plant-science',      // Rhizosphere
  16: 'techniques',         // Living Fences
  17: 'techniques',         // Propagation
  // ADD NEW ARTICLES HERE:
  18: 'maintenance',        // Texas Planting Calendar
  19: 'plant-science',      // Nitrogen Fixers in Texas
  20: 'getting-started',    // Your First Year Plan
  21: 'maintenance',        // Establishment Care: Year 1
  22: 'techniques',         // Creating Your First Guild
};

// Tag mapping — generated by the tag-wiki.mjs script separately
// or you can inline them here if you want one-step import
const TAG_MAP = {
  'the-living-soil-the-soil-food-web':              ['soil', 'fungi', 'biology', 'mulch', 'beginner', 'foundation'],
  'site-assessment-reading-the-land':               ['site', 'observation', 'sun', 'wind', 'water', 'beginner', 'design'],
  'the-vertical-harvest-the-7-layers':              ['layers', 'canopy', 'understory', 'shrub', 'groundcover', 'beginner', 'design'],
  'water-literacy-earthworks-passive-hydrology':    ['water', 'swales', 'earthworks', 'drainage', 'hydrology', 'design'],
  'the-support-guild-companion-planting':           ['guild', 'nitrogen-fixer', 'insectary', 'dynamic-accumulator', 'companion', 'design'],
  'wildlife-pollinators-the-living-security':       ['pollinators', 'wildlife', 'habitat', 'insectary', 'bees'],
  'the-art-of-pruning-chop-drop':                   ['pruning', 'chop-and-drop', 'mulch', 'maintenance', 'technique'],
  'food-forest-design-patterns-paths':              ['design', 'patterns', 'paths', 'layout', 'planning'],
  'successional-harvesting-the-long-game':          ['succession', 'harvest', 'long-term', 'planning', 'maintenance'],
  'protecting-the-fungal-layer':                    ['fungi', 'mycorrhizal', 'soil', 'biology', 'technique'],
  'the-nurse-layer-micro-climates':                 ['microclimate', 'nurse-plant', 'establishment', 'shade', 'technique'],
  'moss-as-a-biological-sponge':                    ['moss', 'groundcover', 'moisture', 'soil', 'technique'],
  'hydrology-the-sponge-strategy':                  ['water', 'hydrology', 'drainage', 'sponge', 'soil'],
  'living-mulches-the-green-blanket':               ['groundcover', 'mulch', 'living-mulch', 'soil', 'technique'],
  'the-rhizosphere-root-communication':             ['rhizosphere', 'roots', 'soil', 'biology', 'underground'],
  'living-fences-hedgerows-fedges':                 ['hedgerow', 'living-fence', 'wildlife', 'habitat', 'design'],
  'infinite-abundance-propagation-willow-water':    ['propagation', 'cuttings', 'willow-water', 'technique', 'beginner'],
  // New articles — paste tags from AI output here:
  // 'texas-planting-calendar':                     ['planting-calendar', 'texas', 'schedule', 'maintenance', 'beginner'],
  // 'nitrogen-fixers-in-texas':                    ['nitrogen-fixer', 'texas', 'guild', 'plant-science', 'soil'],
  // 'your-first-year-plan':                        ['beginner', 'planning', 'year-1', 'getting-started', 'schedule'],
  // 'establishment-care-year-1':                   ['establishment', 'year-1', 'watering', 'maintenance', 'beginner'],
  // 'creating-your-first-guild':                   ['guild', 'technique', 'beginner', 'design', 'nitrogen-fixer'],
};

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')   // remove emojis and special chars
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function clearExistingArticles() {
  console.log('\n🗑️  Clearing existing wiki articles...');
  const snap = await getDocs(collection(db, 'wiki'));
  for (const docSnap of snap.docs) {
    await deleteDoc(doc(db, 'wiki', docSnap.id));
  }
  console.log(`  Deleted ${snap.size} articles`);
}

async function importArticles() {
  console.log('📚 Wiki Import Script\n');

  const articlesPath = path.join(__dirname, '..', 'wiki-import', 'articles.json');
  const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
  console.log(`Found ${articles.length} articles\n`);

  await clearExistingArticles();
  console.log('\n📝 Importing...\n');

  for (const article of articles) {
    const slug = generateSlug(article.title);
    const category = CATEGORY_MAP[article.order] || 'getting-started';
    const tags = TAG_MAP[slug] || [];

    const wikiDoc = {
      title: article.title,
      slug,
      category,
      summary: article.summary,
      content: article.content,
      imageUrl: null,
      learningActivity: article.learning_activity ? {
        title: article.learning_activity.title,
        steps: article.learning_activity.steps,
      } : null,
      reflectiveQuestion: article.reflective_question || null,
      order: article.order,
      tags,
      published: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const docRef = await addDoc(collection(db, 'wiki'), wikiDoc);
      console.log(`  ✅ [${article.order}] ${article.title}`);
      if (tags.length === 0) console.log(`     ⚠️  No tags — add to TAG_MAP`);
    } catch (err) {
      console.error(`  ❌ Failed: ${article.title}`, err.message);
    }
  }

  console.log('\n🎉 Import complete!');
  process.exit(0);
}

importArticles().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
```

**To run:** `node scripts/import-wiki.mjs`

---

## HOW CLAUDE ACCESSES THESE ARTICLES

Claude reads ALL published wiki articles before every conversation. The system loads them from Firestore via a React hook (`useWikiArticles`) and injects them into Claude's system prompt in this format:

```
### Article Title
*Category: plant-science | Slug: nitrogen-fixers-in-texas*
**Summary:** One-sentence description...
[Full article content, up to 1500 characters]
```

Claude is instructed to:
1. Use article content to ground recommendations ("Pigeon Pea fixes nitrogen and is covered in your wiki under 'Nitrogen Fixers in Texas'")
2. Reference articles by their exact title when relevant
3. Summarize rather than quote — point users to read the full article
4. Use the exact terminology from your articles consistently

The slug is important — Claude refers to articles by slug when mentioning them.

---

## THE 5 ARTICLES NEEDED RIGHT NOW (Priority Order)

Write these first. They fill the most critical gaps in Claude's knowledge. Each is listed with the content it MUST include for Claude to use it effectively.

---

### ARTICLE 18: Texas Planting Calendar 🗓️

**Why Claude needs this:** Claude's project manager mode cites specific planting windows constantly. Without this article, it invents dates.

**Must include:**
- A table or structured list: Plant type | Best window | Backup window | Avoid
- Separate guidance for at least 3 Texas regions: Central (Austin/SA, zones 8a-8b), South (zones 9a-9b), East (humidity, piney woods), Hill Country (rocky, alkaline)
- Last frost dates by region (Central TX: mid-Feb average, South TX: late Jan, Hill Country: early-mid March)
- First fall frost dates (Central TX: mid-Dec average — very late)
- Note on climate shift: last frost dates trending earlier, summers hotter and longer
- Specific months for: canopy trees, understory trees, shrubs, nitrogen fixers (like Pigeon Pea), herbaceous perennials, groundcovers, annual vegetables (spring AND fall windows), vines

**Summary to write:** Something like: "Texas has two main planting windows — spring (Feb–May) and fall (Sep–Nov) — with summer heat acting as a third dormant season. Knowing which window fits each plant type is the difference between thriving and struggling."

**Tags:** `planting-calendar`, `texas`, `schedule`, `maintenance`, `beginner`

---

### ARTICLE 19: Nitrogen Fixers in Texas 🌿

**Why Claude needs this:** The most frequently recommended guild function. Claude needs named Texas species it can confidently suggest by name.

**Must include:**
- How nitrogen fixation works (brief, 2-3 sentences — Article 5 covers it generally, this goes Texas-specific)
- A species list of at least 8 Texas-appropriate nitrogen fixers, structured as:
  - Common name (*Scientific name*) — Layer (shrub/canopy/herbaceous) — Effort level 1-5 — Establishment time — One key Texas-specific note
  - Must include: Pigeon Pea, Retama (Parkinsonia aculeata), Texas Mountain Laurel (Sophora secundiflora), Amorpha fruticosa (False Indigo), Desmodium spp. (Tick Trefoil), White Clover (ground level), Mimosa (Albizia julibrissin — note invasive potential), Eve's Necklace (Sophora affinis — native)
- Placement rules: where to put them relative to anchor trees (sunny side, within canopy radius)
- Chop-and-drop timing for Texas (when to prune to maximize nitrogen release)
- Cautions: Pigeon Pea is frost-sensitive (dies at 28°F, treat as annual in zones 8a), Mimosa is invasive in some counties

**Tags:** `nitrogen-fixer`, `texas`, `guild`, `plant-science`, `soil`, `beginner`

---

### ARTICLE 20: Your First Year Plan 🌱

**Why Claude needs this:** The #1 beginner question is "where do I start?" Claude needs a concrete answer grounded in your app's design flow.

**Must include:**
- The "observation before action" principle: Month 1-2, don't plant anything — watch, map, note
- A month-by-month or season-by-season sequence for Year 1, tied directly to the app's layer system:
  - Fall (Sep-Nov): Site prep, sheet mulch, plant canopy trees and nitrogen fixers
  - Winter (Dec-Feb): Observe, plan, plant bare-root trees, order seeds
  - Spring (Mar-May): Fast nitrogen fixers (Pigeon Pea), herbs, groundcover
  - Summer (Jun-Aug): Mulch heavily, water deeply, don't plant (heat dormancy)
- The "quick wins alongside long investments" principle: pair every long-term plant with a fast producer
- A realistic scope for a first-timer: 3-5 plants total in Year 1 is success
- A section on using the Little Food Forests app to plan before you plant

**Tags:** `beginner`, `planning`, `year-1`, `getting-started`, `schedule`, `texas`

---

### ARTICLE 21: Establishment Care (Year 1) 💧

**Why Claude needs this:** When someone commits to a plant, Claude should advise on what happens next. Currently it has nothing.

**Must include:**
- The "establishment triangle": Water + Mulch + Patience (the three non-negotiables)
- Watering schedules by plant type (specific — not "water regularly"):
  - Canopy trees: deep and infrequent — 5-10 gallons every 5-7 days for first 3 months, then taper
  - Shrubs: 2-3 gallons every 3-4 days for 6 weeks
  - Herbaceous perennials: more frequent but shallower — every 2-3 days until established
  - Nitrogen fixers like Pigeon Pea: daily for 2 weeks, then every 3 days
- Mulching rules: 3-4 inch layer, pulled back 2 inches from trunk
- Texas summer survival: when to shade young trees (shade cloth for trees in full sun during first summer)
- Transplant shock vs. failure: how to tell the difference (wilting that recovers overnight = shock; wilting that doesn't = investigate)
- The "don't fertilize a stressed plant" rule

**Tags:** `establishment`, `year-1`, `watering`, `maintenance`, `beginner`, `texas`

---

### ARTICLE 22: Creating Your First Guild 🤝

**Why Claude needs this:** Claude walks users through guild building in the app constantly. It needs a step-by-step reference that matches the app's layer system.

**Must include:**
- What a guild IS (brief — Article 5 has the theory, this is the how-to)
- Step-by-step guild assembly around a Texas fruit tree (use a peach tree as the example — most common Texas backyard fruit tree):
  1. Choose and place your anchor tree (the peach)
  2. Place one nitrogen fixer on the sunny south side within the canopy radius
  3. Place insectary plants (yarrow, fennel, native wildflowers) that bloom at different times
  4. Place a dynamic accumulator (comfrey) at the drip line
  5. Add a pest confuser (garlic, chives) around the perimeter
  6. Fill the floor with living mulch (clover, creeping thyme)
- How to use the app's guild analysis tool to check for missing functions
- The "guild radius rule": all guild plants should be within 1.5x the canopy radius of the anchor tree
- A complete Texas peach tree guild list with specific species

**Tags:** `guild`, `technique`, `beginner`, `design`, `nitrogen-fixer`, `texas`

---

## OUTPUT FORMAT

Deliver your response as:

1. All article JSONs in a single valid JSON array (ready to paste into `articles.json`)
2. After each article, a `TAGS:` line with comma-separated tags
3. A `CATEGORY_MAP additions:` section with the order number and category for each new article
4. A `TAG_MAP additions:` section with the slug and tags formatted for the import script

---

## [YOUR INSTRUCTIONS HERE]

Write the 5 articles listed above (orders 18-22). Follow all format rules exactly.
Use the content requirements for each article as your guide — those are the minimum facts
Claude needs to be useful. Add detail beyond the requirements where it improves the article.

Keep the voice warm, practical, and Texas-specific. Remember: a beginner in Austin
who just bought their first house is your primary reader. Claude is your secondary reader.

If you have additional source material to incorporate, treat it as supplementary detail
to weave into the required structure — don't let it override the format.
