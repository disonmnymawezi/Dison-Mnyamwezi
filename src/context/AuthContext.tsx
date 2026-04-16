import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, testConnection } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection(db);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    let unsubProfile: (() => void) | null = null;
    const path = `users/${user.uid}`;

    const syncProfile = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            favorites: [],
            role: user.email?.toLowerCase().trim() === 'disonmnyamwezi@gmail.com' ? 'admin' : 'user',
            joinedAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, newProfile);
          setProfile(newProfile);
        } else {
          // Sync existing profile with auth data if needed
          const existingData = userDoc.data() as UserProfile;
          if ((user.displayName && !existingData.displayName) || (user.photoURL && !existingData.photoURL)) {
            const updates: Partial<UserProfile> = {};
            if (user.displayName && !existingData.displayName) updates.displayName = user.displayName;
            if (user.photoURL && !existingData.photoURL) updates.photoURL = user.photoURL;
            
            if (Object.keys(updates).length > 0) {
              await setDoc(userDocRef, updates, { merge: true });
            }
          }
        }

        unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        }, (error) => {
          console.error('Profile listener error:', error);
          // Don't throw here to avoid crashing the app
        });
      } catch (error) {
        console.error('Profile sync error:', error);
      } finally {
        setLoading(false);
      }
    };

    syncProfile();

    return () => {
      if (unsubProfile) unsubProfile();
    };
  }, [user]);

  const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase().trim() === 'disonmnyamwezi@gmail.com';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
