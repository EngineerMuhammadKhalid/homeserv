import { collection, addDoc, setDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Don't throw for seeding errors to avoid crashing the app on load
}

const sampleProviders = [
  {
    userId: 'sample_1',
    bio: 'Expert plumber with 10 years of experience in residential and commercial repairs.',
    hourlyRate: 1200,
    experienceYears: 10,
    verificationStatus: 'verified',
    availabilityStatus: true,
    categories: ['Plumbing', 'AC Repair'],
    rating: 4.8,
    reviewCount: 45
  },
  {
    userId: 'sample_2',
    bio: 'Professional electrician specializing in home wiring and appliance repairs.',
    hourlyRate: 1500,
    experienceYears: 7,
    verificationStatus: 'verified',
    availabilityStatus: true,
    categories: ['Electrical'],
    rating: 4.9,
    reviewCount: 32
  },
  {
    userId: 'sample_3',
    bio: 'Deep cleaning specialist for homes and offices. Eco-friendly products used.',
    hourlyRate: 800,
    experienceYears: 5,
    verificationStatus: 'verified',
    availabilityStatus: true,
    categories: ['Cleaning'],
    rating: 4.7,
    reviewCount: 120
  }
];

export const seedData = async () => {
  for (const provider of sampleProviders) {
    try {
      const docRef = doc(db, 'service_providers', provider.userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        await setDoc(docRef, provider);
        console.log('Seeded provider:', provider.userId);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `service_providers/${provider.userId}`);
    }
  }
};
