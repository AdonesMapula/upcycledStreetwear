import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBLa7xObhirUoOooKRBG2Kb_5_sFNY4aSo",
  authDomain: "upcycled-streetwear.firebaseapp.com",
  projectId: "upcycled-streetwear",
  storageBucket: "upcycled-streetwear.firebasestorage.app",
  messagingSenderId: "410226515488",
  appId: "1:410226515488:web:3a8bbbaf054bb2eefea645",
  measurementId: "G-QLQY51HR40"
};

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Initialize Firestore with error handling
let db;
try {
  db = getFirestore(app);
  console.log('Firestore initialized successfully');
} catch (error) {
  console.error('Error initializing Firestore:', error);
  throw error;
}

// Initialize Auth with error handling
let auth;
try {
  auth = getAuth(app);
  console.log('Firebase Auth initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Auth:', error);
  throw error;
}

// Initialize Storage with error handling
let storage;
try {
  storage = getStorage(app);
  console.log('Firebase Storage initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Storage:', error);
  throw error;
}

// Test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    if (!db) {
      console.error('Firestore not initialized');
      return false;
    }
    
    // Try to get a document to test connection
    const { collection, getDocs, limit } = await import('firebase/firestore');
    const testQuery = await getDocs(collection(db, 'test'));
    console.log('Firebase connection test successful');
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

export { db, auth, storage };
export default app;
