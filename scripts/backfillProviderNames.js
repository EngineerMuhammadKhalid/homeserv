/**
 * Backfill provider names from the `users` collection into `service_providers`.
 *
 * Usage:
 * 1. Place your Firebase service account JSON at the repo root as `serviceAccountKey.json`.
 * 2. Run in repo root:
 *    node scripts/backfillProviderNames.js [--dry-run]
 *
 * The script will iterate all documents under `service_providers` and, when a
 * corresponding `users/{id}` doc contains a `name` (or `displayName`), it will
 * write that into `service_providers/{id}.name` (merge=true).
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
  const dryRun = process.argv.includes('--dry-run');
  console.log(`Starting backfill of provider names (${dryRun ? 'dry-run' : 'live'})`);

  const snap = await db.collection('service_providers').get();
  console.log(`Found ${snap.size} provider documents.`);

  let updated = 0;
  for (const docSnap of snap.docs) {
    const providerId = docSnap.id;
    const providerData = docSnap.data() || {};

    // Skip if already has a non-empty name
    if (providerData.name && String(providerData.name).trim().length > 0) {
      continue;
    }

    const userRef = db.collection('users').doc(providerId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      console.log(`-> No user record for provider ${providerId}`);
      continue;
    }
    const u = userSnap.data() || {};
    const candidate = u.name || u.displayName || u.email;
    if (!candidate) {
      console.log(`-> User ${providerId} has no name/displayName/email to copy`);
      continue;
    }

    console.log(`-> Will set provider ${providerId}.name -> "${candidate}"`);
    if (!dryRun) {
      await db.collection('service_providers').doc(providerId).set({ name: candidate }, { merge: true });
      updated++;
    }
  }

  console.log(`Backfill complete. Updated ${updated} documents.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
