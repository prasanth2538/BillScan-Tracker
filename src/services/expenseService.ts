import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export interface RawExpense {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  createdAt?: any;
  icon?: string;
  color?: string;
  paymentMethod?: string;
}

let _cache: RawExpense[] | null = null;
let _cacheUid: string | null = null;

export function invalidateExpenseCache() {
  _cache = null;
  _cacheUid = null;
}

export const getExpenses = async (
  forceRefresh = false
): Promise<RawExpense[]> => {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("Not logged in");
  }

  if (_cache && !forceRefresh && _cacheUid === uid) {
    return _cache;
  }

  const q = query(
    collection(db, "users", uid, "expenses"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  const expenses = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as RawExpense[];

  _cache = expenses;
  _cacheUid = uid;

  return expenses;
};

export const getThisMonthExpenses = async (
  forceRefresh = false
): Promise<RawExpense[]> => {
  const all = await getExpenses(forceRefresh);
  const now = new Date();

  return all.filter((e) => {
    if (!e.createdAt) return true;

    const d = e.createdAt.toDate
      ? e.createdAt.toDate()
      : new Date(e.createdAt);

    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });
};

export const updateExpense = async (expenseId: string, data: any) => {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("Not logged in");
  }

  if (!expenseId) {
    throw new Error("Expense ID missing");
  }

  await updateDoc(doc(db, "users", uid, "expenses", expenseId), {
    ...data,
    amount: Number(data.amount),
  });

  invalidateExpenseCache();
};

export const deleteExpense = async (expenseId: string) => {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("Not logged in");
  }

  if (!expenseId) {
    throw new Error("Expense ID missing");
  }

  await deleteDoc(doc(db, "users", uid, "expenses", expenseId));

  invalidateExpenseCache();
};