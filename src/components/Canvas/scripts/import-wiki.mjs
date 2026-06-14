// scripts/import-wiki.mjs
// Run with: node scripts/import-wiki.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAJeuUwjHDhC67_y6Z3bzJM88Nwh8QzAbU',
  authDomain: 'little-food-forests.firebaseapp.com',
  projectId: 'little-food-forests',
  storageBucket: 'little-food-forests.firebasestorage.app',
  messagingSenderId: '724137388400',
  appId: '1:724137388400:web:24207d2a08c482609e47b5',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Category mapping based on article order
const CATEGORY_MAP = {
  1: 'getting-started',    // Living Soil
  2: 'getting-started',    // Site Assessment
  3: 'getting-started',    // 7 Layers
  4: 'design-principles',  // Water Literacy
  5: 'plant-science',      // Support Guild
  6: 'techniques',         // Wildlife & Pollinators
  7: 'techniques',         // Pruning
  8: 'design-principles',  // Design
  9: 'maintenance',        // Successional Harvest
  10: 'techniques',        // Fungal Protection
  11: 'techniques',        // Nurse Layer
  12: 'techniques',        // Moss
  13: 'design-principles', // Hydrology
  14: 'plant-science',     // Living Mulches
  15: 'plant-science',     // Rhizosphere
  16: 'techniques',        // Living Fences
  17: 'techniques',        // Propagation
  18: 'getting-started',   // Texas Planting Calendar
  19: 'plant-science',     // Nitrogen Fixers in Texas
  20: 'getting-started',   // Your First Year Plan
  21: 'maintenance',       // Establishment Care Year 1
  22: 'design-principles', // Creating Your First Guild
  23: 'design-principles', // Spacing & Distance Rules
  24: 'plant-science',     // Texas Fruit Tree Species Guide
  25: 'techniques',        // Alkaline Soil in Texas
  26: 'getting-started',   // The 3-Hour Gardener
  27: 'maintenance',       // The Full-Time Food Forester
  28: 'design-principles', // Water System Design
  29: 'maintenance',       // Year-Round Maintenance Calendar
  30: 'plant-science',     // Texas Canopy Tree Guide
  31: 'plant-science',     // Understory & Shrub Species Guide
  32: 'plant-science',     // Herbs & Dynamic Accumulators
  33: 'techniques',        // Sheet Mulching Step by Step
  34: 'techniques',        // Deer Pressure Management
  35: 'techniques',        // Polyculture Annual Beds
  36: 'design-principles', // Zone & Sector Mapping
  37: 'techniques',        // Composting for Your Food Forest
  38: 'getting-started',   // Food Forests for Renters & Small Spaces
  39: 'design-principles', // Food Forest Design Layouts
  40: 'maintenance',       // Pest & Disease Management
  41: 'motivation',        // The Gardener's Hierarchy
  42: 'motivation',        // The Psychology of Getting Started
  43: 'motivation',        // Flow State & the Garden
  44: 'motivation',        // Habit Formation in the Garden
  45: 'motivation',        // Tiny Experiments
  46: 'motivation',        // Meaning, Purpose & the Food Forest
  47: 'motivation',        // Setbacks, Rest & Returning
  48: 'motivation',        // How to Advise Well
};

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function uploadImage(imagePath) {
  if (!imagePath) return null;

  // Handle both absolute paths and relative paths
  let fullPath = imagePath;
  if (!path.isAbsolute(imagePath)) {
    fullPath = path.join(__dirname, '..', 'wiki-import', imagePath);
  }

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️ Image not found: ${fullPath}`);
    return null;
  }

  try {
    const fileBuffer = fs.readFileSync(fullPath);
    const fileName = path.basename(fullPath);
    const storageRef = ref(storage, `wiki-images/${fileName}`);

    console.log(`  📤 Uploading: ${fileName}`);
    await uploadBytes(storageRef, fileBuffer);
    const url = await getDownloadURL(storageRef);
    console.log(`  ✅ Uploaded: ${url.substring(0, 60)}...`);
    return url;
  } catch (error) {
    console.error(`  ❌ Failed to upload ${imagePath}:`, error);
    return null;
  }
}

async function clearExistingArticles() {
  console.log('\n🗑️ Clearing existing wiki articles...');
  const wikiRef = collection(db, 'wiki');
  const snapshot = await getDocs(wikiRef);

  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'wiki', docSnap.id));
  }
  console.log(`  Deleted ${snapshot.size} existing articles`);
}

async function importArticles() {
  console.log('📚 Wiki Import Script');
  console.log('=====================\n');

  // Read articles.json
  const articlesPath = path.join(__dirname, '..', 'wiki-import', 'articles.json');

  if (!fs.existsSync(articlesPath)) {
    console.error('❌ articles.json not found at:', articlesPath);
    process.exit(1);
  }

  const articlesRaw = fs.readFileSync(articlesPath, 'utf-8');
  const articles = JSON.parse(articlesRaw);

  console.log(`Found ${articles.length} articles to import\n`);

  // Clear existing articles
  await clearExistingArticles();

  console.log('\n📝 Importing articles...\n');

  for (const article of articles) {
    console.log(`\n[${article.order}] ${article.title}`);

    // Upload image if exists
    let imageUrl = null;
    if (article.image_path) {
      imageUrl = await uploadImage(article.image_path);
    }

    // Get category from mapping
    const category = CATEGORY_MAP[article.order] || 'getting-started';

    // Create Firestore document
    const wikiDoc = {
      title: article.title,
      slug: generateSlug(article.title),
      category,
      summary: article.summary,
      content: article.content,
      imageUrl: imageUrl || null,
      learningActivity: article.learning_activity ? {
        title: article.learning_activity.title,
        steps: article.learning_activity.steps,
      } : null,
      reflectiveQuestion: article.reflective_question || null,
      order: article.order,
      tags: [],
      published: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const docRef = await addDoc(collection(db, 'wiki'), wikiDoc);
      console.log(`  ✅ Created: ${docRef.id} (${category})`);
    } catch (error) {
      console.error(`  ❌ Failed to create article:`, error);
    }
  }

  console.log('\n\n🎉 Import complete!');
  process.exit(0);
}

// Run the import
importArticles().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
