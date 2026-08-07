import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBSOMQqkVq_DoK4W5poQkaluE37SHMt_cU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "billscan-tracker.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "billscan-tracker",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "billscan-tracker.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "96515613425",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:96515613425:web:bc8df851df81802251ff50",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);