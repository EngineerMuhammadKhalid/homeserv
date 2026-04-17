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

const sampleCustomers = [
  {
    userId: 'customer_1',
    name: 'Rachel Mitchell',
    email: 'rachel.mitchell@example.com',
    address: 'London, United Kingdom',
    phone: '+44 20 7946 0958',
    city: 'London',
    country: 'United Kingdom',
    userType: 'customer',
    createdAt: new Date().toISOString(),
    recentSearches: ['Plumbing', 'Leak Repairs', 'Electrical'],
    profile: {
      firstName: 'Rachel',
      lastName: 'Mitchell',
      profileComplete: true,
      preferences: {
        preferredServices: ['Plumbing', 'Electrical'],
        budget: 'medium'
      }
    }
  },
  {
    userId: 'customer_2',
    name: 'James Anderson',
    email: 'james.anderson@example.com',
    address: 'Birmingham, United Kingdom',
    phone: '+44 121 236 2000',
    city: 'Birmingham',
    country: 'United Kingdom',
    userType: 'customer',
    createdAt: new Date().toISOString(),
    recentSearches: ['Cleaning', 'Gardening', 'Handyman'],
    profile: {
      firstName: 'James',
      lastName: 'Anderson',
      profileComplete: true,
      preferences: {
        preferredServices: ['Cleaning', 'Gardening'],
        budget: 'high'
      }
    }
  }
];

const sampleProviders = [
  {
    userId: 'sample_1',
    name: 'John Mitchell',
    username: 'john_plumbing',
    bio: 'Certified plumber with 8 years experience. Quick response, reliable service. Serving London and surrounding areas.',
    address: 'London, United Kingdom',
    hourlyRate: 15,
    experienceYears: 8,
    verificationStatus: 'verified',
    availabilityStatus: true,
    categories: ['Plumbing'],
    services: ['Leak Repairs', 'Pipe Installation', 'Bathroom Fixtures', 'Drain Cleaning'],
    rating: 4.8,
    reviewCount: 45,
    portfolio: ['https://picsum.photos/seed/plumber1/400', 'https://picsum.photos/seed/plumber2/400']
  },
  {
    userId: 'sample_2',
    name: 'Sarah Johnson',
    username: 'sarah_electrical',
    bio: 'Qualified electrician with 6 years of experience. Fully insured and certified. Available in Birmingham.',
    address: 'Birmingham, United Kingdom',
    hourlyRate: 18,
    experienceYears: 6,
    verificationStatus: 'verified',
    availabilityStatus: true,
    categories: ['Electrical'],
    services: ['Lighting Installation', 'Socket Installation', 'Wiring Repairs', 'Safety Inspections'],
    rating: 4.9,
    reviewCount: 52,
    portfolio: ['https://picsum.photos/seed/electrician1/400']
  },
  {
    userId: 'sample_3',
    name: 'Emma Davies',
    username: 'emma_cleaning',
    bio: 'Professional cleaner specializing in deep cleaning. Eco-friendly products. Serving Manchester and suburbs.',
    address: 'Manchester, United Kingdom',
    hourlyRate: 12,
    experienceYears: 5,
    verificationStatus: 'verified',
    availabilityStatus: true,
    categories: ['Cleaning'],
    services: ['Deep Cleaning', 'Regular Maintenance', 'Post Construction Cleaning', 'Eco-Friendly Solutions'],
    rating: 4.7,
    reviewCount: 120,
    portfolio: ['https://picsum.photos/seed/cleaning1/400', 'https://picsum.photos/seed/cleaning2/400', 'https://picsum.photos/seed/cleaning3/400']
  },
  {
    userId: 'sample_4',
    name: 'Michael Bradley',
    username: 'mike_carpentry',
    bio: 'Experienced carpenter. Custom wooden furniture, repairs, and restoration. Based in Leeds.',
    address: 'Leeds, United Kingdom',
    hourlyRate: 16,
    experienceYears: 9,
    verificationStatus: 'verified',
    availabilityStatus: true,
    categories: ['Carpentry'],
    services: ['Furniture Repair', 'Custom Woodwork', 'Door Installation', 'Shelf Fitting'],
    rating: 4.6,
    reviewCount: 38,
    portfolio: ['https://picsum.photos/seed/carpenter1/400', 'https://picsum.photos/seed/carpenter2/400']
  },
  {
    userId: 'sample_5',
    name: 'Lisa Thompson',
    username: 'lisa_painting',
    bio: 'Professional painter and decorator. Interior and exterior work. Quality finishes guaranteed. Glasgow based.',
    address: 'Glasgow, United Kingdom',
    hourlyRate: 14,
    experienceYears: 7,
    verificationStatus: 'verified',
    availabilityStatus: true,
    categories: ['Painting & Decorating'],
    services: ['Interior Painting', 'Exterior Painting', 'Wallpaper Installation', 'Colour Consultation'],
    rating: 4.8,
    reviewCount: 67,
    portfolio: ['https://picsum.photos/seed/painter1/400', 'https://picsum.photos/seed/painter2/400', 'https://picsum.photos/seed/painter3/400']
  },
  {
    userId: 'sample_6',
    name: 'David Roberts',
    username: 'david_gardening',
    bio: 'Landscapen and garden maintenance specialist. Transform your outdoor space. Serving Edinburgh.',
    address: 'Edinburgh, United Kingdom',
    hourlyRate: 13,
    experienceYears: 10,
    verificationStatus: 'verified',
    availabilityStatus: true,
    categories: ['Gardening'],
    services: ['Garden Design', 'Lawn Maintenance', 'Tree Trimming', 'Hedge Cutting', 'Patio Cleaning'],
    rating: 4.9,
    reviewCount: 91,
    portfolio: ['https://picsum.photos/seed/garden1/400', 'https://picsum.photos/seed/garden2/400', 'https://picsum.photos/seed/garden3/400']
  },
  {
    userId: 'sample_7',
    name: 'Rachel Green',
    username: 'rachel_handyman',
    bio: 'General handyman for all household tasks. Reliable, honest, professional. Bristol based.',
    address: 'Bristol, United Kingdom',
    hourlyRate: 11,
    experienceYears: 6,
    verificationStatus: 'verified',
    availabilityStatus: true,
    categories: ['Handyman'],
    services: ['General Repairs', 'Furniture Assembly', 'Caulking & Sealants', 'Drywall Repair'],
    rating: 4.5,
    reviewCount: 34,
    portfolio: ['https://picsum.photos/seed/handyman1/400']
  },
  {
    userId: 'sample_8',
    name: 'William Stone',
    username: 'will_hvac',
    bio: 'HVAC specialist with 11 years experience. Boiler servicing and repairs. Cardiff.',
    address: 'Cardiff, United Kingdom',
    hourlyRate: 17,
    experienceYears: 11,
    verificationStatus: 'verified',
    availabilityStatus: true,
    categories: ['HVAC'],
    services: ['Boiler Servicing', 'Heating Repairs', 'Air Conditioning', 'System Installation'],
    rating: 4.9,
    reviewCount: 74,
    portfolio: ['https://picsum.photos/seed/hvac1/400']
  },
  {
    userId: 'sample_9',
    name: 'Sophie Wilson',
    username: 'sophie_locksmith',
    bio: 'Professional locksmith. Emergency call-outs available. Covering Liverpool and area.',
    address: 'Liverpool, United Kingdom',
    hourlyRate: 20,
    experienceYears: 8,
    verificationStatus: 'verified',
    availabilityStatus: true,
    categories: ['Locksmith'],
    services: ['Lock Installation', 'Emergency Lockout', 'Lock Repair', 'Key Cutting'],
    rating: 4.7,
    reviewCount: 56,
    portfolio: []
  },
  {
    userId: 'sample_10',
    name: 'Thomas Harris',
    username: 'thomas_tiling',
    bio: 'Expert tiler with extensive experience in bathroom and kitchen installations. Sheffield.',
    address: 'Sheffield, United Kingdom',
    hourlyRate: 19,
    experienceYears: 9,
    verificationStatus: 'verified',
    availabilityStatus: true,
    categories: ['Tiling'],
    services: ['Bathroom Tiling', 'Kitchen Splashback', 'Floor Tiling', 'Tile Repair'],
    rating: 4.8,
    reviewCount: 43,
    portfolio: ['https://picsum.photos/seed/tiling1/400', 'https://picsum.photos/seed/tiling2/400']
  }
];

export const seedData = async () => {
  // Seed service providers - silently skip if permission denied
  for (const provider of sampleProviders) {
    try {
      const docRef = doc(db, 'service_providers', provider.userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        await setDoc(docRef, provider);
        console.log('Seeded provider:', provider.userId);
      }
    } catch (e: any) {
      // Only log permission errors silently for seeding (not blocking)
      if (e.code !== 'permission-denied') {
        handleFirestoreError(e, OperationType.WRITE, `service_providers/${provider.userId}`);
      }
    }
  }

  // Seed customers - silently skip if permission denied
  for (const customer of sampleCustomers) {
    try {
      const docRef = doc(db, 'users', customer.userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        await setDoc(docRef, customer);
        console.log('Seeded customer:', customer.userId);
      }
    } catch (e: any) {
      // Only log permission errors silently for seeding (not blocking)
      if (e.code !== 'permission-denied') {
        handleFirestoreError(e, OperationType.WRITE, `users/${customer.userId}`);
      }
    }
  }
};
