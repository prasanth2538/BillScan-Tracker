export interface ParsedBill {
  amount: number;
  merchant: string;
  category: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const cleanName = (name: string): string => {
  name = name.replace(/[^a-zA-Z\s]/g, "").trim();
  const words = name.split(/\s+/).filter((w) => w.length > 2);
  name = words.join(" ");
  name = name.replace(/\b[A-Z]{1,2}\b$/g, "").trim();
  return name;
};

// ─── Amount Extraction (1:1 port of Python extract_amount) ─────────────────

export const extractAmount = (rawText: string): number => {
  if (!rawText?.trim()) return 0;

  // Python: text.replace("Rs.", "₹") etc.
  let text = rawText
    .replace(/Rs\./g, "₹")
    .replace(/Rs/g, "₹")
    .replace(/INR/g, "₹");

  const lines = text.split("\n");
  const lowerText = text.toLowerCase();

  const ignoreWords = [
    "cashback", "earned", "reward", "offer",
    "transaction id", "utr", "debited",
    "account", "banking", "date", "time",
    "view history", "split expense",
    "send again", "xxxx",
  ];

  const shouldIgnore = (line: string): boolean =>
    ignoreWords.some((w) => line.toLowerCase().includes(w));

  // ── PHONEPE / UPI METHOD ────────────────────────────────────────────────────
  if (lowerText.includes("paid to")) {



    // isNoisyLine uses shouldIgnore which blocks "debited" — but ₹ lines
    // may contain "debited". Use a looser check for ₹ lines only.
    const isBlockedLine = (line: string): boolean => {
      if (/\+?\d{10,}/.test(line)) return true;   // phone numbers
      if (/@/.test(line)) return true;              // UPI IDs
      if (/UTR/i.test(line)) return true;
      if (/transaction id/i.test(line)) return true;
      if (/send again|view history|split expense|cashback|earned|reward/i.test(line)) return true;
      if (/^[A-Z0-9]{15,}$/.test(line.trim())) return true; // transaction IDs
      return false;
    };

    // Pass 1: Find ANY ₹NNN pattern on any non-blocked line
    // Handles: standalone "₹250", inline "Karrodu Room ₹600", "₹1 debited..." etc.
    for (const line of lines) {
      if (isBlockedLine(line)) continue;
      // Match ₹ followed by digits — ignore what comes after (emoji, text, etc.)
      const m = line.match(/₹\s*(\d+)/);
      if (m) {
        let amount = parseFloat(m[1]);
        if ([2024, 2025, 2026, 2027, 2614].includes(amount)) continue;
        const s = String(Math.trunc(amount));
        if (s.startsWith("22") && s.length === 4) amount = parseInt(s.slice(1), 10);
        if (amount >= 10 && amount <= 99999) return amount;
      }
    }

    // Pass 2: MLKit misreads ₹ as "7" — ₹540→7540, ₹600→7600
    for (const line of lines) {
      if (isBlockedLine(line)) continue;
      const matches = [...line.matchAll(/\b7(\d{2,4})\b/g)].map((m) => m[1]);
      for (const match of matches) {
        const amount = parseFloat(match);
        if ([2024, 2025, 2026, 2027, 2614].includes(amount)) continue;
        if (amount >= 10 && amount <= 5000) return amount;
      }
    }

    // Pass 3: bare-digit fallback — line must have letters, 3+ digits only
    for (const line of lines) {
      if (isBlockedLine(line)) continue;
      if (!/[a-zA-Z]{3,}/.test(line)) continue;
      const matches = [...line.matchAll(/\b(\d{3,5})\b/g)].map((m) => m[1]);
      for (const match of matches) {
        let amount = parseFloat(match);
        if ([2024, 2025, 2026, 2027, 2614].includes(amount)) continue;
        const s = String(Math.trunc(amount));
        if (s.startsWith("22") && s.length === 4) amount = parseInt(s.slice(1), 10);
        if (amount >= 10 && amount <= 5000) return amount;
      }
    }
  }

  // ── PETROL / BILL METHOD (Python: amounts = []) ───────────────────────────
  let explicitTotal = 0;
  const amounts: number[] = [];

  for (const line of lines) {
    if (shouldIgnore(line)) continue;

    // Support commas in amounts like 3,769.50
    const matches = [...line.matchAll(/[\d,]+\.\d{2}/g)].map((m) => m[0]);

    for (const match of matches) {
      const cleanMatch = match.replace(/,/g, "");
      const amount = parseFloat(cleanMatch);
      if (amount >= 10 && amount <= 100000) {
        const lowerLine = line.toLowerCase();
        if (
          lowerLine.includes("total") ||
          lowerLine.includes("amount to pay") ||
          lowerLine.includes("net amount") ||
          lowerLine.includes("amount payable")
        ) {
          explicitTotal = Math.max(explicitTotal, amount);
        }
        amounts.push(amount);
      }
    }
  }

  if (explicitTotal > 0) return explicitTotal;
  if (amounts.length > 0) return Math.max(...amounts);

  // ── PAYTM FALLBACK (Python: if "money received" ... or "amount") ──────────
  if (lowerText.includes("money received") || lowerText.includes("amount")) {
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].toLowerCase().includes("amount")) continue;

      const searchArea = lines.slice(i, i + 5);

      for (const rowRaw of searchArea) {
        const row = rowRaw.replace(/,/g, "");

        // Python: matches = re.findall(r'\b\d{2,5}\b', row)
        const matches = [...row.matchAll(/\b\d{2,5}\b/g)].map((m) => m[0]);

        for (const match of matches) {
          const amount = parseFloat(match);
          if ([2024, 2025, 2026, 2027].includes(amount)) continue;
          if (amount >= 10 && amount <= 100000) return amount;
        }
      }
    }
  }

  // ── PAYMENT SUCCESSFUL SCREEN FALLBACK ────────────────────────────────────
  if (lowerText.includes("payment successful")) {
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].toLowerCase().includes("payment successful")) continue;

      const searchArea = lines.slice(i, i + 6);

      for (let row of searchArea) {
        const rowLower = row.toLowerCase();

        // Skip date/time lines and noise
        if (
          ["cashback", "earned", "transaction", "upi", "date",
            "view details", "done", "notes", "paid via",
            "jan", "feb", "mar", "apr", "may", "jun",
            "jul", "aug", "sep", "oct", "nov", "dec",
            "am", "pm"].some((w) => rowLower.includes(w))
        ) continue;
        // Skip pure date patterns like "12 Sep 2025, 7:44 PM"
        if (/\d{1,2}\s+\w+\s+\d{4}/.test(row)) continue;

        row = row.replace(/,/g, "");

        // Python: OCR may read ₹50 as 50, S0, SO
        row = row.replace(/S/g, "5").replace(/O/g, "0").replace(/o/g, "0");

        const matches = [...row.matchAll(/\b\d{2,5}\b/g)].map((m) => m[0]);

        for (const match of matches) {
          const amount = parseFloat(match);
          if ([2024, 2025, 2026, 2027].includes(amount)) continue;
          if (amount >= 20 && amount <= 5000) return amount;
        }
      }
    }
  }

  // Python: return None → we return 0
  return 0;
};

// ─── Merchant Extraction ─────────────────────────────────────────────────────

export const extractMerchant = (rawText: string): string => {
  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const skipWords = [
    "send again",
    "view history",
    "split expense",
    "share receipt",
    "transaction",
    "transfer",
    "details",
    "debited",
    "utr",
    "contact",
    "support",
    "powered",
    "banking name",
    "paid to",
    "payment successful",
    "cashback",
    "earned",
    "view details",
    "done",
    "upi transaction id",
    "amount",
    "rupees",
    "money received",
    "share",
    "help",
    "paytm",
    "postpaid",
  ];

  const isSkipped = (line: string): boolean => {
    if (skipWords.some((w) => line.toLowerCase().includes(w))) return true;
    // Skip filename lines: "Screenshot 2026-05-15 122423.png" or "Screenshot_2026-05-15.png"
    if (/screenshot/i.test(line)) return true;
    if (/\.png|\.jpg|\.jpeg|\.pdf/i.test(line)) return true;
    // Skip lines that are purely a date/time
    if (/^\d{1,2}\s+\w+\s+\d{4}/.test(line.trim())) return true;
    return false;
  };

  // Pattern 1: "To <name>" prefix
  for (const line of lines) {
    if (line.toLowerCase().startsWith("to ")) {
      const merchant = cleanName(line.replace(/^to\s+/i, ""));
      if (merchant.length > 3) return merchant;
    }
  }

  // Pattern 2a: "Paid to Name" inline on same line (GPay style: "Paid to Karan Gupta")
  for (const line of lines) {
    const inlineMatch = line.match(/^paid\s+to\s+(.+)/i);
    if (inlineMatch?.[1]) {
      const merchant = cleanName(inlineMatch[1].trim());
      if (merchant.length > 2) return merchant;
    }
  }

  // Pattern 2b: "Paid to" on its own line, name on next lines (PhonePe style)
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].toLowerCase().includes("paid to")) continue;

    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const candidate = lines[j];

      if (isSkipped(candidate)) continue;
      if (/\+?\d{10,}/.test(candidate)) continue;   // phone number
      if (/₹\s?\d+/.test(candidate)) continue;       // amount line
      if (/@/.test(candidate)) continue;               // UPI ID like 9876543210@ybl

      const merchant = cleanName(
        candidate.replace(/Paid to/gi, "").replace(/Paid/gi, "")
      );
      if (merchant.length > 3) return merchant;
    }
  }

  // Pattern 3: Lines after standalone "From"
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().trim() !== "from") continue;

    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const merchant = cleanName(lines[j]);
      if (merchant.length > 3 && !isSkipped(merchant)) return merchant;
    }
  }

  // Pattern 4: "Received from: Name" inline
  for (const line of lines) {
    const m = line.match(/received\s+from[:\s]+(.+)/i);
    if (m?.[1]) {
      const merchant = cleanName(m[1].trim());
      if (merchant.length > 3) return merchant;
    }
  }

  // Prefer ALL-CAPS multi-word business name from ANY line (MLKit scrambles order)
  // e.g. "SAI BALAJI PETROLEUM" beats "ANAPALLE" (single word city)
  for (const line of lines) {
    if (isSkipped(line)) continue;
    const merchant = cleanName(line);
    // Must be ALL CAPS, 2+ words, length > 8 — strong business header signal
    if (
      merchant.length > 8 &&
      /^[A-Z][A-Z\s]{4,}$/.test(merchant) &&
      merchant.trim().split(/\s+/).length >= 2
    ) return merchant;
  }

  // Fallback: first clean non-noise line in top 8
  for (const line of lines.slice(0, 8)) {
    if (isSkipped(line)) continue;
    const merchant = cleanName(line);
    if (merchant.length > 5) return merchant;
  }

  return "Unknown Merchant";
};

// ─── Category Detection ──────────────────────────────────────────────────────

// Maps to exact labels used in ScanScreen's CATEGORIES array
export const detectCategory = (rawText: string): string => {
  const lower = rawText.toLowerCase();

  if (["petrol", "diesel", "fuel", "hpl", "hpcl", "iocl", "bharat petroleum"].some((w) => lower.includes(w)))
    return "Petrol";

  if (["restaurant", "food", "cafe", "biryani", "pizza", "zomato", "swiggy", "dominos", "burger"].some((w) => lower.includes(w)))
    return "Food";

  if (["grocery", "groceries", "dmart", "supermarket", "mart", "bigbasket", "blinkit", "zepto", "vegetables", "fruits"].some((w) => lower.includes(w)))
    return "Groceries";

  if (["uber", "ola", "rapido", "metro", "train", "bus", "ticket", "cab", "auto"].some((w) => lower.includes(w)))
    return "Transport";

  if (["movie", "cinema", "pvr", "inox", "theatre", "bookmyshow"].some((w) => lower.includes(w)))
    return "Movies";

  if (["hospital", "medical", "pharmacy", "clinic", "doctor", "apollo", "fortis", "pathlab"].some((w) => lower.includes(w)))
    return "Hospital";

  // UPI / payment apps — return Other (no specific UPI category in ScanScreen)
  if (["upi", "payment successful", "money received", "paid to", "phonepe", "gpay", "paytm"].some((w) => lower.includes(w)))
    return "Other";

  return "Other";
};

// ─── Main Export ─────────────────────────────────────────────────────────────

export const parseWithOwnAI = (rawOCRText: string): ParsedBill => {
  return {
    amount: extractAmount(rawOCRText),
    merchant: extractMerchant(rawOCRText),
    category: detectCategory(rawOCRText),
  };
};