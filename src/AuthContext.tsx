import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { seedData } from './seed';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAuthReady: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  refreshProfile: async () => {},
});

import { handleFirestoreError, OperationType } from './utils/errorHandlers';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize seed data on mount
  useEffect(() => {
    seedData().catch(err => console.error('Error seeding data:', err));
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      if (profileSnap.exists()) {
        setProfile(profileSnap.data());
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // Clean up previous profile listener if any
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (user) {
        const profileRef = doc(db, 'users', user.uid);
        
        // Initial fetch with a small retry logic for potential race conditions
        const fetchProfile = async (retries = 3) => {
          try {
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              setProfile(profileSnap.data());
            }
          } catch (err: any) {
            if (retries > 0 && err.code === 'permission-denied') {
              console.warn(`Profile fetch permission denied, retrying... (${retries} left)`);
              setTimeout(() => fetchProfile(retries - 1), 500);
            } else {
              console.error('Initial profile fetch error:', err);
            }
          }
        };

        fetchProfile();
        
        // Real-time profile updates
        profileUnsubscribe = onSnapshot(profileRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data());
          }
        }, (error) => {
          // Only handle error if user is still logged in
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          }
        });
      } else {
        setProfile(null);
      }
      
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
