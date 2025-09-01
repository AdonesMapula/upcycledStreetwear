import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if Firebase Auth is initialized
    if (!auth) {
      console.error('Firebase Auth not initialized');
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setIsLoggedIn(true);
          setUser(firebaseUser);
          // Store user data in AsyncStorage for offline access
          await AsyncStorage.setItem('user', JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName
          }));
        } else {
          setIsLoggedIn(false);
          setUser(null);
          await AsyncStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Register a new user with Firebase
  const registerUser = useCallback(async (email, password, displayName = '') => {
    try {
      // Check if Firebase Auth is initialized
      if (!auth) {
        console.error('Firebase Auth not initialized');
        return { success: false, error: 'Authentication service not available' };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile with display name if provided
      if (displayName) {
        await updateProfile(firebaseUser, { displayName });
      }

      // Create user document in Firestore
      if (db) {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          email: firebaseUser.email,
          displayName: displayName || '',
          createdAt: new Date().toISOString(),
          role: 'user'
        });
      }

      return { success: true, user: firebaseUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Sign in with Firebase
  const signIn = useCallback(async (email, password) => {
    try {
      // Check if Firebase Auth is initialized
      if (!auth) {
        console.error('Firebase Auth not initialized');
        return { success: false, error: 'Authentication service not available' };
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Sign out from Firebase
  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  // Get user data from Firestore
  const getUserData = useCallback(async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isLoggedIn,
    isLoading,
    user,
    signIn,
    signOut,
    registerUser,
    getUserData
  }), [isLoggedIn, isLoading, user, signIn, signOut, registerUser, getUserData]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
