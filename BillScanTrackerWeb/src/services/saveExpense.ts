import { db, auth } from "../firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { invalidateExpenseCache } from "./expenseService";
import { checkDuplicateBill } from "./billImageService";

export const saveExpense = async (data: any) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User not logged in");
    }

    const merchant = data.merchant || "Unknown Merchant";
    const amount = Number(data.amount || 0);
    const date = data.date || new Date().toISOString().split("T")[0];
    const ocrText = data.ocrText || data.rawOCRText || "";
    const category = data.category || "Other";

    // 1. Check duplicate before saving
    const dupCheck = await checkDuplicateBill(merchant, amount, date, ocrText);
    if (dupCheck.isDuplicate) {
      throw new Error("⚠ This receipt already exists.");
    }

    // 2. Save details in Firestore (bill image saving feature removed per user request)
    const ref = await addDoc(collection(db, "users", user.uid, "expenses"), {
      merchant,
      amount,
      category,
      date,
      ocrText,
      imageUrl: "",
      icon: data.icon || "📄",
      color: data.color || "#F5F5F5",
      source: data.source || "scan",
      createdAt: Timestamp.now(),
    });

    invalidateExpenseCache();

    return ref.id;

  } catch (error: any) {
    console.error("Save error:", error);
    throw error; // send error to UI
  }
};