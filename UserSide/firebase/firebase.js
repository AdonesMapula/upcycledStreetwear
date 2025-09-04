// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLa7xObhirUoOooKRBG2Kb_5_sFNY4aSo",
  authDomain: "upcycled-streetwear.firebaseapp.com",
  projectId: "upcycled-streetwear",
  storageBucket: "upcycled-streetwear.firebasestorage.app",
  messagingSenderId: "410226515488",
  appId: "1:410226515488:web:3a8bbbaf054bb2eefea645",
  measurementId: "G-QLQY51HR40",
};

// ✅ Prevent duplicate initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();


// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
