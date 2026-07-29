import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

/**
 * Compress base64 data URL to max dimensions and lower JPEG quality
 * to reduce upload size from ~4MB down to ~60KB.
 */
export const compressImage = (
  dataUrl: string,
  maxWidth = 800,
  quality = 0.6
): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:")) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

/**
 * Upload a compressed base64 data-URL image to Firebase Storage with a 6-second timeout fail-safe.
 * Returns the public download URL, or empty string on failure/timeout so expense saving never stalls.
 */
export const uploadBillImage = async (_dataUrl: string): Promise<string> => {
  // Feature disabled per user preference: bill images are not saved.
  return "";
};

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingId?: string;
}

/**
 * Calculate Jaccard text similarity between two strings (0.0 to 1.0)
 */
export const calculateTextSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  const clean1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
  const clean2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
  if (clean1 === clean2) return 1.0;
  if (!clean1 || !clean2) return 0;

  const tokens1 = clean1.split(/\s+/).filter((t) => t.length > 1);
  const tokens2 = clean2.split(/\s+/).filter((t) => t.length > 1);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let intersection = 0;
  set1.forEach((t) => {
    if (set2.has(t)) intersection++;
  });

  const union = new Set([...set1, ...set2]).size;
  return union > 0 ? intersection / union : 0;
};

/**
 * Check if a bill with the same merchant, amount, date, and OCR text already exists.
 */
export const checkDuplicateBill = async (
  merchant: string,
  amount: number,
  date: string,
  ocrText: string = ""
): Promise<DuplicateCheckResult> => {
  const uid = auth.currentUser?.uid;
  if (!uid) return { isDuplicate: false };

  try {
    const q = query(
      collection(db, "users", uid, "expenses"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);

    const normalizedMerchant = (merchant || "").trim().toLowerCase();
    const normalizedDate = (date || "").split("T")[0];

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const existingMerchant = (data.merchant || "").trim().toLowerCase();
      const existingAmount = Number(data.amount || 0);
      const existingDate = (data.date || "").split("T")[0];
      const existingOcr = data.ocrText || data.rawOCRText || "";

      const merchantMatch =
        !normalizedMerchant || !existingMerchant
          ? true
          : existingMerchant === normalizedMerchant ||
            (existingMerchant.length > 3 && normalizedMerchant.includes(existingMerchant)) ||
            (normalizedMerchant.length > 3 && existingMerchant.includes(normalizedMerchant));

      const amountMatch = Math.abs(existingAmount - amount) < 0.01;
      const dateMatch = !normalizedDate || !existingDate || existingDate === normalizedDate;

      const ocrSimilarity = calculateTextSimilarity(ocrText, existingOcr);

      if (amountMatch && dateMatch && merchantMatch) {
        if (!ocrText || !existingOcr || ocrSimilarity >= 0.2) {
          return { isDuplicate: true, existingId: docSnap.id };
        }
      }

      if (amountMatch && ocrSimilarity >= 0.75) {
        return { isDuplicate: true, existingId: docSnap.id };
      }
    }

    return { isDuplicate: false };
  } catch (err) {
    console.error("Duplicate check failed:", err);
    return { isDuplicate: false };
  }
};

