import { auth, db } from "../firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { invalidateExpenseCache } from "./expenseService";

export interface SaveExpenseInput {
  merchant?: string;
  category?: string;
  amount: number;
  date?: string;
  icon?: string;
  color?: string;
  paymentMethod?: string;
}

export const saveExpense = async (expense: SaveExpenseInput) => {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("Not logged in");
  }

  const amount = Number(expense.amount);

  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }

  await addDoc(collection(db, "users", uid, "expenses"), {
    merchant: expense.merchant || "Unknown Merchant",
    category: expense.category || "Other",
    amount,
    date: expense.date || new Date().toISOString().split("T")[0],
    icon: expense.icon || "📄",
    color: expense.color || "#F5F5F5",
    paymentMethod: expense.paymentMethod || "Cash",
    createdAt: serverTimestamp(),
  });

  invalidateExpenseCache();
};