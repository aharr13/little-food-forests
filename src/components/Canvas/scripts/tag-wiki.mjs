// scripts/tag-wiki.mjs
// Adds searchable tags to existing wiki articles in Firestore.
// Run with: node scripts/tag-wiki.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

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

// Tags per article slug — maps the article's content to searchable categories.
// Claude uses these to mentally index which article covers what topic.
const SLUG_TAGS = {
  // Articles 1–17 (original)
  'the-living-soil-the-soil-food-web':          ['soil', 'fungi', 'biology', 'mulch', 'beginner', 'foundation'],
  'site-assessment-reading-the-land':            ['site', 'observation', 'sun', 'wind', 'water', 'beginner', 'design'],
  'the-vertical-harvest-the-7-layers':           ['layers', 'canopy', 'understory', 'shrub', 'groundcover', 'beginner', 'design'],
  'water-literacy-earthworks-passive-hydrology': ['water', 'swales', 'earthworks', 'drainage', 'hydrology', 'design'],
  'the-support-guild-companion-planting':        ['guild', 'nitrogen-fixer', 'insectary', 'dynamic-accumulator', 'companion', 'design'],
  'wildlife-pollinators-the-living-security':    ['pollinators', 'wildlife', 'habitat', 'insectary', 'bees'],
  'the-art-of-pruning-chop-drop':                ['pruning', 'chop-and-drop', 'mulch', 'maintenance', 'technique'],
  'food-forest-design-patterns-paths':           ['design', 'patterns', 'paths', 'layout', 'planning'],
  'successional-harvesting-the-long-game':       ['succession', 'harvest', 'long-term', 'planning', 'maintenance'],
  'protecting-the-fungal-layer':                 ['fungi', 'mycorrhizal', 'soil', 'biology', 'technique'],
  'the-nurse-layer-micro-climates':              ['microclimate', 'nurse-plant', 'establishment', 'shade', 'technique'],
  'moss-as-a-biological-sponge':                 ['moss', 'groundcover', 'moisture', 'soil', 'technique'],
  'hydrology-the-sponge-strategy':               ['water', 'hydrology', 'drainage', 'sponge', 'soil'],
  'living-mulches-the-green-blanket':            ['groundcover', 'mulch', 'living-mulch', 'soil', 'technique'],
  'the-rhizosphere-root-communication':          ['rhizosphere', 'roots', 'soil', 'biology', 'underground'],
  'living-fences-hedgerows-fedges':              ['hedgerow', 'living-fence', 'wildlife', 'habitat', 'design'],
  'infinite-abundance-propagation-willow-water': ['propagation', 'cuttings', 'willow-water', 'technique', 'beginner'],
  // Articles 18–40 (Texas-specific & practical)
  'texas-planting-calendar':                     ['texas', 'calendar', 'planting', 'seasons', 'beginner', 'planning'],
  'nitrogen-fixers-in-texas':                    ['nitrogen-fixer', 'texas', 'guild', 'plant-science', 'pigeon-pea'],
  'your-first-year-plan':                        ['beginner', 'planning', 'first-year', 'texas', 'getting-started'],
  'establishment-care-year-1':                   ['establishment', 'watering', 'maintenance', 'beginner', 'texas'],
  'creating-your-first-guild':                   ['guild', 'design', 'beginner', 'companion', 'texas'],
  'spacing-distance-rules':                      ['spacing', 'design', 'layout', 'canopy', 'planning'],
  'texas-fruit-tree-species-guide':              ['texas', 'fruit-trees', 'species', 'plant-science', 'peach', 'fig'],
  'alkaline-soil-in-texas':                      ['soil', 'texas', 'alkaline', 'ph', 'amendment', 'technique'],
  'the-3-hour-gardener':                         ['beginner', 'time', 'low-maintenance', 'getting-started', 'habit'],
  'the-full-time-food-forester':                 ['advanced', 'maintenance', 'planning', 'long-term', 'mastery'],
  'water-system-design':                         ['water', 'drip', 'irrigation', 'design', 'texas', 'drought'],
  'year-round-maintenance-calendar':             ['maintenance', 'calendar', 'texas', 'seasons', 'planning'],
  'texas-canopy-tree-guide':                     ['texas', 'canopy', 'species', 'plant-science', 'pecan', 'oak'],
  'understory-shrub-species-guide':              ['understory', 'shrub', 'texas', 'species', 'plant-science'],
  'herbs-dynamic-accumulators':                  ['herbs', 'dynamic-accumulator', 'comfrey', 'plant-science', 'guild'],
  'sheet-mulching-step-by-step':                 ['mulch', 'sheet-mulch', 'technique', 'beginner', 'soil'],
  'deer-pressure-management':                    ['deer', 'pest', 'texas', 'protection', 'technique'],
  'polyculture-annual-beds':                     ['annuals', 'polyculture', 'technique', 'food', 'companion'],
  'zone-sector-mapping':                         ['zone', 'sector', 'design', 'mapping', 'planning'],
  'composting-for-your-food-forest':             ['compost', 'soil', 'technique', 'biology', 'maintenance'],
  'food-forests-for-renters-small-spaces':       ['beginner', 'small-space', 'renter', 'container', 'getting-started'],
  'food-forest-design-layouts':                  ['design', 'layout', 'planning', 'patterns', 'beginner'],
  'pest-disease-management':                     ['pest', 'disease', 'maintenance', 'technique', 'texas'],
  // Articles 41–48 (motivation & psychology)
  'the-gardener-s-hierarchy':                    ['motivation', 'psychology', 'maslow', 'beginner', 'advisor'],
  'the-psychology-of-getting-started':           ['motivation', 'psychology', 'beginner', 'starting', 'habit'],
  'flow-state-the-garden':                       ['motivation', 'psychology', 'flow', 'focus', 'wellbeing'],
  'habit-formation-in-the-garden':               ['motivation', 'habit', 'psychology', 'routine', 'maintenance'],
  'tiny-experiments':                            ['motivation', 'experimentation', 'observation', 'learning', 'science'],
  'meaning-purpose-the-food-forest':             ['motivation', 'psychology', 'meaning', 'purpose', 'values'],
  'setbacks-rest-returning':                     ['motivation', 'psychology', 'resilience', 'setback', 'recovery'],
  'how-to-advise-well-a-guide-for-claude':       ['advisor', 'motivation', 'psychology', 'teaching', 'communication'],
};

async function tagArticles() {
  console.log('🏷️  Tagging wiki articles...\n');
  const snap = await getDocs(collection(db, 'wiki'));
  let updated = 0;
  let skipped = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const slug = data.slug || '';
    const tags = SLUG_TAGS[slug];

    if (!tags) {
      console.log(`  ⚠️  No tag mapping found for slug: "${slug}"`);
      skipped++;
      continue;
    }

    await updateDoc(doc(db, 'wiki', docSnap.id), { tags });
    console.log(`  ✅ ${data.title}`);
    console.log(`     tags: ${tags.join(', ')}`);
    updated++;
  }

  console.log(`\n✅ Tagged ${updated} articles, skipped ${skipped}.`);
  process.exit(0);
}

tagArticles().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
