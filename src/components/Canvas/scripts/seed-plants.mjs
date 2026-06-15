// scripts/seed-plants.mjs
// Run with: node scripts/seed-plants.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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
const auth = getAuth(app);

// Sign in as the admin user. Firestore rules only allow the admin to write the
// `plants` collection, so the seed script must authenticate first.
// Run with:  SEED_EMAIL=you@example.com SEED_PASSWORD=yourpassword node ...seed-plants.mjs
async function signInAsAdmin() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  if (!email || !password) {
    console.error('❌ Set SEED_EMAIL and SEED_PASSWORD env vars (the admin account) before running.');
    process.exit(1);
  }
  await signInWithEmailAndPassword(auth, email, password);
  console.log(`🔐 Signed in as ${email}`);
}

async function clearExistingPlants() {
  console.log('\n🗑️ Clearing existing plants...');
  const plantsRef = collection(db, 'plants');
  const snapshot = await getDocs(plantsRef);

  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'plants', docSnap.id));
  }
  console.log(`  Deleted ${snapshot.size} existing plants`);
}

async function seedPlants() {
  console.log('🌱 Plant Database Seed Script');
  console.log('=============================\n');

  // Read plants data (data/ lives at the project root, four levels up from this script)
  const plantsPath = path.resolve(__dirname, '..', '..', '..', '..', 'data', 'plants-texas.json');

  if (!fs.existsSync(plantsPath)) {
    console.error('❌ plants-texas.json not found at:', plantsPath);
    process.exit(1);
  }

  const plantsRaw = fs.readFileSync(plantsPath, 'utf-8');
  const plants = JSON.parse(plantsRaw);

  console.log(`Found ${plants.length} plants to import\n`);

  // Authenticate before any writes (admin-only under Firestore rules)
  await signInAsAdmin();

  // Clear existing plants
  await clearExistingPlants();

  console.log('\n📝 Importing plants...\n');

  let count = 0;
  for (const plant of plants) {
    const plantDoc = {
      ...plant,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const docRef = await addDoc(collection(db, 'plants'), plantDoc);
      console.log(`  ✅ ${plant.commonName} (${plant.layerTypes.join(', ')})`);
      count++;
    } catch (error) {
      console.error(`  ❌ Failed to create ${plant.commonName}:`, error);
    }
  }

  console.log(`\n\n🎉 Import complete! Added ${count} plants.`);
  process.exit(0);
}

// Run the seed
seedPlants().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
