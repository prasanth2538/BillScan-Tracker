import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBSOMQqkVq_DoK4W5poQkaluE37SHMt_cU",
  authDomain: "billscan-tracker.firebaseapp.com",
  projectId: "billscan-tracker",
  storageBucket: "billscan-tracker.firebasestorage.app",
  messagingSenderId: "96515613425",
  appId: "1:96515613425:web:bc8df851df81802251ff50",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);