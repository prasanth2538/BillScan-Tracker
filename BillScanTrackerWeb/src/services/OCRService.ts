import { API_BASE_URL } from "../config/api";

export interface OCRItemBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OCRItem {
  text: string;
  confidence: number;
  box: OCRItemBox;
}

export interface StructuredOCRResult {
  text: string;
  confidence: number;
  items: OCRItem[];
  amount?: number;
  merchant?: string;
}

async function prepareImageFile(file: File): Promise<File> {
  // If file is already a clean standard JPEG or PNG, use as-is
  if (file.type === "image/jpeg" || file.type === "image/png") {
    return file;
  }

  // Otherwise, render through Canvas to ensure clean JPEG format & correct EXIF orientation
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );

    if (blob) {
      const cleanName = (file.name || "uploaded_bill").replace(/\.[^/.]+$/, "") + ".jpg";
      return new File([blob], cleanName, { type: "image/jpeg" });
    }
  } catch (err) {
    console.warn("Canvas image re-encoding skipped:", err);
  }

  return file;
}

export const OCRService = {
  async uploadAndExtractText(file: File): Promise<StructuredOCRResult> {
    const cleanFile = await prepareImageFile(file);

    const formData = new FormData();
    formData.append("image", cleanFile, cleanFile.name || "bill.jpg");
    formData.append("file", cleanFile, cleanFile.name || "bill.jpg");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${API_BASE_URL}/ocr`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `Server error (HTTP ${response.status})`;
        try {
          const errJson = (await response.json()) as { detail?: string; error?: string };
          if (errJson && (errJson.detail || errJson.error)) {
            errorMsg = errJson.detail || errJson.error || errorMsg;
          }
        } catch {
          // Response body non-JSON
        }

        if (response.status === 400) {
          throw new Error(errorMsg || "Invalid image file uploaded.");
        } else if (response.status === 500) {
          throw new Error(errorMsg || "OCR processing failed on server.");
        } else {
          throw new Error(errorMsg);
        }
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response format received from OCR server.");
      }

      if (typeof data !== "object" || data === null) {
        throw new Error("Invalid response received from OCR server.");
      }

      const resObj = data as Record<string, unknown>;
      const text = typeof resObj.text === "string" ? resObj.text : "";
      const confidence = typeof resObj.confidence === "number" ? resObj.confidence : 0;
      const amount = typeof resObj.amount === "number" ? resObj.amount : undefined;
      const merchant = typeof resObj.merchant === "string" ? resObj.merchant : undefined;

      const items: OCRItem[] = Array.isArray(resObj.items)
        ? resObj.items.map((rawItem: unknown) => {
          const item = (typeof rawItem === "object" && rawItem !== null ? rawItem : {}) as Record<string, unknown>;
          const box = (typeof item.box === "object" && item.box !== null ? item.box : {}) as Record<string, number>;
          return {
            text: typeof item.text === "string" ? item.text : "",
            confidence: typeof item.confidence === "number" ? item.confidence : 0,
            box: {
              x: Number(box.x) || 0,
              y: Number(box.y) || 0,
              w: Number(box.w) || 0,
              h: Number(box.h) || 0,
            },
          };
        })
        : [];

      return {
        text,
        confidence,
        items,
        amount,
        merchant,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          throw new Error("OCR request timed out. Please check your connection and try again.");
        }

        if (err instanceof TypeError && err.message.toLowerCase().includes("failed to fetch")) {
          throw new Error("Unable to connect to backend server. Please ensure FastAPI is running on port 8000.");
        }

        throw err;
      }

      throw new Error("An unexpected error occurred during OCR processing.");
    }
  },
};
