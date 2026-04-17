/**
 * Usage:
 * 1. Place your Firebase service account JSON at the repo root as `serviceAccountKey.json`.
 * 2. Run: `node scripts/updateProviderName.js PROVIDER_ID "New Provider Name"`
 *
 * This script uses the Firebase Admin SDK and will update the `name` field on the
 * document at `service_providers/{PROVIDER_ID}` (merge=true).
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (err) {
  console.error('Failed to load serviceAccountKey.json from repo root.');
  console.error('Download a service account JSON from Firebase Console and save it as serviceAccountKey.json');
  process.exit(1);
}

const db = admin.firestore();

async function run() {
  const providerId = process.argv[2];
  const newName = process.argv[3];
  if (!providerId || !newName) {
    console.error('Usage: node scripts/updateProviderName.js PROVIDER_ID "New Provider Name"');
    process.exit(1);
  }

  const ref = db.collection('service_providers').doc(providerId);
  try {
    await ref.set({ name: newName }, { merge: true });
    console.log(`Updated provider ${providerId} name -> ${newName}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to update provider name:', err);
    process.exit(1);
  }
}

run();
