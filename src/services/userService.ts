import { auth, db } from "../firebase";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export interface FirebaseUserProfile {
  id: string;
  name?: string;
  email?: string;
  age?: number;
  monthlyIncome?: number;
  monthlyBudget?: number;
}

export const saveUserProfile = async (userData: any) => {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    console.warn("saveUserProfile: not logged in");
    return;
  }

  await setDoc(doc(db, "users", uid), {
    name: userData.name,
    email: userData.email ?? auth.currentUser?.email ?? "",
    age: userData.age || "",
    monthlyIncome: Number(userData.monthlyIncome || 0),
    monthlyBudget: Number(
      userData.monthlyBudget || userData.monthlyIncome || 0
    ),
    createdAt: new Date(),
  });
};

export const getUserProfile =
  async (): Promise<FirebaseUserProfile | null> => {

    const uid = auth.currentUser?.uid;

    if (!uid) {
      throw new Error("Not logged in");
    }

    const snap = await getDoc(doc(db, "users", uid));

    if (!snap.exists()) {
      return null;
    }

    const data = snap.data() as Omit<FirebaseUserProfile, "id">;

    return {
      id: snap.id,
      ...data,
    };
};

export const updateUserProfile = async (data: any) => {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("Not logged in");
  }

  await updateDoc(doc(db, "users", uid), {
    ...data,
  });
};