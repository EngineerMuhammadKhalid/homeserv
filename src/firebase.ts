import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import fileConfig from '../firebase-applet-config.json';

// Build config from Vite env vars (Vercel will provide these) with fallback
const env = import.meta.env as Record<string, string | undefined>;

const firebaseConfig = {
	apiKey: env.VITE_FIREBASE_API_KEY || (fileConfig as any).apiKey,
	authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (fileConfig as any).authDomain,
	projectId: env.VITE_FIREBASE_PROJECT_ID || (fileConfig as any).projectId,
	appId: env.VITE_FIREBASE_APP_ID || (fileConfig as any).appId,
	storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || (fileConfig as any).storageBucket,
	messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || (fileConfig as any).messagingSenderId,
	measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || (fileConfig as any).measurementId,
	// Non-standard key used in this repo for multi-tenancy
	firestoreDatabaseId: env.VITE_FIRESTORE_DATABASE_ID || (fileConfig as any).firestoreDatabaseId,
};

// Singleton pattern for Firebase initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig as any) : getApp();

export const auth = getAuth(app);

// Optional: Set persistence explicitly to avoid some race conditions in iframes
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const storage = getStorage(app);

// If running locally against the Firestore emulator, connect when requested.
// Use environment variables in your shell or .env: VITE_USE_FIRESTORE_EMULATOR=true and VITE_FIRESTORE_EMULATOR_PORT=8080
try {
	const useEmu = (env.VITE_USE_FIRESTORE_EMULATOR || 'false') === 'true';
	const port = Number(env.VITE_FIRESTORE_EMULATOR_PORT || '8080');
	if (useEmu) {
		// connect to local emulator
		connectFirestoreEmulator(db, 'localhost', port);
		console.info(`Connected Firestore to emulator at localhost:${port}, databaseId=${(firebaseConfig as any).firestoreDatabaseId}`);
	}
} catch (e) {
	console.warn('Failed to connect to Firestore emulator:', e);
}
