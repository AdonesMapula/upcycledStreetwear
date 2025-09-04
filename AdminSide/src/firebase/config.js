import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBLa7xObhirUoOooKRBG2Kb_5_sFNY4aSo",
  authDomain: "upcycled-streetwear.firebaseapp.com",
  projectId: "upcycled-streetwear",
  storageBucket: "upcycled-streetwear.firebasestorage.app",
  messagingSenderId: "410226515488",
  appId: "1:410226515488:web:3a8bbbaf054bb2eefea645",
  measurementId: "G-QLQY51HR40"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
