/**
 * Reset selected top-level Firestore collections by deleting all documents.
 * WARNING: Destructive! Use with care. This permanently deletes documents.
 *
 * Usage:
 * 1. Place `serviceAccountKey.json` from Firebase Console at repo root.
 * 2. Dry-run (no deletes):
 *    node scripts/resetDatabase.js --collections=users,service_providers,bookings
 *
 * 3. To actually delete, add --confirm:
 *    node scripts/resetDatabase.js --collections=users,service_providers --confirm
 *
 * To delete the default set (users,service_providers,bookings,wallets,verifications,reviews,invoices,disputes,reports):
 *    node scripts/resetDatabase.js --confirm
 */

const admin = require('firebase-admin');
const path = require('path');

const DEFAULT_COLLECTIONS = [
  'users',
  'service_providers',
  'bookings',
  'wallets',
  'verifications',
  'reviews',
  'invoices',
  'disputes',
  'reports',
  'messages'
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { collections: null, confirm: false };
  for (const a of args) {
    if (a.startsWith('--collections=')) {
      out.collections = a.split('=')[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    if (a === '--confirm') out.confirm = true;
  }
  return out;
}

async function initAdmin() {
  const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  let serviceAccount;
  try {
    serviceAccount = require(serviceAccountPath);
  } catch (err) {
    console.error('Could not load serviceAccountKey.json. Place the JSON key at the repo root.');
    process.exit(1);
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin.firestore();
}

async function deleteCollection(db, collectionPath) {
  console.log('Deleting collection:', collectionPath);
  const collectionRef = db.collection(collectionPath);
  // Delete in batches of 500
  const batchSize = 500;
  let deleted = 0;
  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    if (snapshot.empty) break;
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.docs.length;
    console.log(`Deleted ${deleted} documents from ${collectionPath}...`);
  }
  console.log(`Finished deleting collection: ${collectionPath}`);
}

async function main() {
  const args = parseArgs();
  const collections = args.collections || DEFAULT_COLLECTIONS;

  console.log('Collections target:', collections.join(', '));
  if (!args.confirm) {
    console.log('\nDRY RUN - no deletions will occur. To perform deletion add --confirm.');
    process.exit(0);
  }

  const db = await initAdmin();

  for (const col of collections) {
    try {
      await deleteCollection(db, col);
    } catch (err) {
      console.error(`Failed to delete collection ${col}:`, err.message || err);
    }
  }

  console.log('Database reset completed.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
