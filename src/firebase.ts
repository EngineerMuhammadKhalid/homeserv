import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Singleton pattern for Firebase initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Optional: Set persistence explicitly to avoid some race conditions in iframes
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
