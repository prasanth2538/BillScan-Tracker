import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  signOut,
} from "firebase/auth";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

// LOGIN
export const loginUser = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

// REGISTER + SAVE PROFILE
export const registerUser = async (
  email: string,
  password: string,
  userData: any
) => {

  // create auth account
  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // save user profile in firestore
  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email,

    name: userData.name || "",
    age: Number(userData.age || 0),

    monthlyIncome: Number(userData.monthlyIncome || 0),
    monthlyBudget: Number(
      userData.monthlyBudget ||
      userData.monthlyIncome ||
      0
    ),

    createdAt: Timestamp.now(),
  });

  return cred.user;
};

// FORGOT PASSWORD
export const forgotPassword = (email: string) => {
  const actionCodeSettings = {
    url: window.location.origin + window.location.pathname,
    handleCodeInApp: true,
  };
  return sendPasswordResetEmail(auth, email, actionCodeSettings);
};

// RESET PASSWORD WITH ACTION CODE
export const resetPasswordWithCode = (oobCode: string, newPassword: string) =>
  confirmPasswordReset(auth, oobCode, newPassword);

export const verifyResetCode = (oobCode: string) =>
  verifyPasswordResetCode(auth, oobCode);

// LOGOUT
export const logoutUser = () =>
  signOut(auth);
export const changePassword = async (
  oldPassword: string,
  newPassword: string
) => {
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error("User not logged in");
  }

  const credential = EmailAuthProvider.credential(
    user.email,
    oldPassword
  );

  await reauthenticateWithCredential(user, credential);

  await updatePassword(user, newPassword);
};