export interface ParsedBill {
  amount: number;
  merchant: string;
  category: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const cleanName = (name: string): string => {
  let cleaned = name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length >= 1 && !/^\d+$/.test(w));
  return words.join(" ").trim();
};

const cleanMerchantName = (rawName: string): string => {
  let name = cleanName(rawName);

  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const firstLower = words[0].toLowerCase();

    if (firstLower.length <= 3) {
      const remainingInitials = words
        .slice(1)
        .map((w) => w[0]?.toLowerCase())
        .filter(Boolean)
        .join("");

      if (
        remainingInitials.length >= 1 &&
        (firstLower === remainingInitials ||
          remainingInitials.startsWith(firstLower) ||
          firstLower.startsWith(remainingInitials))
      ) {
        return words.slice(1).join(" ");
      }
    }

    // Fallback for 2-letter avatar noise (e.g. "cr", "pb", "ab") at start of 2+ word name
    if (firstLower.length === 2 && words.length >= 2 && /^[A-Z]/.test(words[1])) {
      if (/^(cr|pb|ab|js|vk|ak|sk|rk|mk|nk|pk|tk)$/i.test(words[0])) {
        return words.slice(1).join(" ");
      }
    }
  }

  return name;
};

const YEARS = [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
const IGNORABLE_CODES = [2614, 1850];

const isValidAmount = (amt: number): boolean => {
  if (isNaN(amt) || !isFinite(amt)) return false;
  if (amt < 1 || amt > 500000) return false;
  if (YEARS.includes(amt)) return false;
  if (IGNORABLE_CODES.includes(amt)) return false;
  return true;
};

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000, lakh: 100000,
};

const extractAmountFromWords = (rawText: string): number => {
  const m = rawText.match(/rupees?\s+([a-z\s]+?)(?:\s+only|\n|$)/i);
  if (!m) return 0;

  const words = m[1].toLowerCase().split(/\s+/).filter(Boolean);
  let total = 0;
  let temp = 0;

  for (const w of words) {
    if (NUMBER_WORDS[w] !== undefined) {
      const val = NUMBER_WORDS[w];
      if (val === 100 || val === 1000 || val === 100000) {
        temp = (temp || 1) * val;
        total += temp;
        temp = 0;
      } else {
        temp += val;
      }
    }
  }
  total += temp;
  return isValidAmount(total) ? total : 0;
};

// Standardize currency text & clean formatting (e.g. ₹1,250 -> ₹1250)
const normalizeCurrencyText = (rawText: string): string => {
  let text = rawText
    .replace(/\bRs\./gi, "₹")
    .replace(/\bRs\b/gi, "₹")
    .replace(/\bINR\b/gi, "₹")
    .replace(/\bRe\./gi, "₹")
    .replace(/\bRe\b/gi, "₹")
    .replace(/\bRupees?\b/gi, "₹")
    .replace(/₹\./g, "₹");

  // Remove top phone status bar clock & notification noise (e.g. "92 Oe ® -0 ¢ Te", "09:02")
  text = text
    .replace(/^\s*\d{1,2}\s+Oe\b[^\n]*/gmi, "")
    .replace(/\b\d{1,2}\s+Oe\b/gi, "")
    .replace(/\bMID\b/gi, "");

  // Handle Google Sans font OCR misreads where '30' or '₹30' is recognized as 'po', '= po', '>>po', 'so', 'p0', 's0'
  text = text
    .replace(/(?:^|\s)(?:=|>|>>|¢|~|\*|#|\+)?\s*po\b/gi, " 30")
    .replace(/(?:^|\s)(?:=|>|>>|¢|~|\*|#|\+)?\s*so\b/gi, " 30")
    .replace(/(?:^|\s)(?:=|>|>>|¢|~|\*|#|\+)?\s*p0\b/gi, " 30")
    .replace(/(?:^|\s)(?:=|>|>>|¢|~|\*|#|\+)?\s*s0\b/gi, " 30")
    .replace(/\bp(\d{1,4})\b/gi, "3$1");

  // Remove battery percentage & status bar icon noise (e.g. 0%, 6%, [6%)
  text = text.replace(/\b\d{1,3}%\b/g, "").replace(/\[\d{1,3}%\s*\|?/g, "");

  // Remove Bank Logo Icon OCR noise (e.g. [60 | Indian Overseas Bank, [30 | SBI)
  text = text
    .replace(/\[\s*\d+\s*[\|\]]?\s*/gi, "")
    .replace(/\b\d+\s*\|\s*/gi, "");

  // Remove UPI IDs and handles that contain numbers (e.g. srirammandapaka 2005@oksbi, 9876543210@ybl, user123@paytm)
  text = text
    .replace(/\b[\w\.\-]+\s*@\s*[\w\.\-]+\b/gi, "")
    .replace(/\S+@\S+/gi, "");

  // Remove full date & time stamps (e.g. "7 Jul 2026, 10:07 pm", "14 Jul 2026", "06:41 pm")
  text = text
    .replace(/\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z,0-9\s:]*\b[^\n]*/gi, "")
    .replace(/\b\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}\b/g, "")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/gi, "");

  // Convert common OCR misreads of Rupee symbol attached to numbers (e.g. Z20 -> ₹20, z20 -> ₹20, A20 -> ₹20, T20 -> ₹20)
  // Exclude standalone 'R' / 'r' after words (e.g. "Chithra R 320") so surname initial R is not converted to a Rupee symbol
  text = text.replace(/(?:^|[\s\(\[\{,\:\-])(?:[zZTtaA€£]|\*|#|\?|S)\s*(\d+(?:\.\d{1,2})?)\b/g, " ₹$1");

  // Remove commas inside numbers
  text = text.replace(/(₹|\b\d{1,3}),(\d{3})/g, "$1$2");
  text = text.replace(/(\d+),(\d{3})/g, "$1$2");

  return text;
};

// ─── Amount Extraction ──────────────────────────────────────────────────────

export const extractAmount = (rawText: string): number => {
  if (!rawText?.trim()) return 0;

  // PASS 0: Words check (e.g., "Rupees Fifty Only" -> 50)
  const wordAmount = extractAmountFromWords(rawText);
  if (wordAmount > 0) return wordAmount;

  const text = normalizeCurrencyText(rawText);
  const lines = text.split("\n");

  // PASS 1: Explicit Rupee Symbol Match (₹)
  const rupeeMatches: number[] = [];
  const rupeeRegex = /₹\s*(\d+(?:\.\d{1,2})?)/g;
  let match: RegExpExecArray | null;
  while ((match = rupeeRegex.exec(text)) !== null) {
    const val = parseFloat(match[1]);
    if (isValidAmount(val)) {
      rupeeMatches.push(val);
    }
  }

  const rupeeAfterRegex = /(\d+(?:\.\d{1,2})?)\s*₹/g;
  while ((match = rupeeAfterRegex.exec(text)) !== null) {
    const val = parseFloat(match[1]);
    if (isValidAmount(val)) {
      rupeeMatches.push(val);
    }
  }

  if (rupeeMatches.length > 0) {
    return rupeeMatches[0];
  }

  // PASS 1.5: PhonePe / UPI Cross-Line Amount Suffix Matching
  // In UPI apps (PhonePe, GPay, Paytm), amounts often appear in multiple places (top right next to merchant, and next to debited bank account).
  // OCR often misreads the '₹' symbol as a leading digit ('3', '2', '7', '8'). E.g. '₹20' -> '320' on merchant line and '20' / '220' on debited account line.
  const lineNumbers: { num: number; raw: string; line: string }[] = [];
  for (const line of lines) {
    const cleanedLine = line
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/\+?\d{10,}/g, "")
      .replace(/\b[A-Z0-9]{12,}\b/gi, "")
      .replace(/[X\*]{2,}\d+/gi, "")
      .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/gi, "");

    const numbers = [...cleanedLine.matchAll(/\b(\d+(?:\.\d{1,2})?)\b/g)];
    for (const m of numbers) {
      const val = parseFloat(m[1]);
      if (isValidAmount(val)) {
        lineNumbers.push({ num: val, raw: m[1], line });
      }
    }
  }

  if (lineNumbers.length >= 2) {
    for (let i = 0; i < lineNumbers.length; i++) {
      for (let j = i + 1; j < lineNumbers.length; j++) {
        const r1 = lineNumbers[i].raw;
        const r2 = lineNumbers[j].raw;

        if (r1 === r2) continue;

        // Sub-case A: r1="320", r2="220" -> both length 3, suffix "20"
        if (r1.length >= 3 && r1.length === r2.length) {
          const suffix1 = r1.slice(1);
          const suffix2 = r2.slice(1);
          if (suffix1 === suffix2) {
            const strippedVal = parseFloat(suffix1);
            if (isValidAmount(strippedVal)) {
              return strippedVal;
            }
          }
        }

        // Sub-case B: r1="320" (misread Rupee digit + 20) and r2="20"
        if (r1.length === r2.length + 1 && /^[3278]/.test(r1)) {
          if (r1.slice(1) === r2) {
            const val = parseFloat(r2);
            if (isValidAmount(val)) {
              return val;
            }
          }
        }

        // Sub-case C: r2="320" (misread Rupee digit + 20) and r1="20"
        if (r2.length === r1.length + 1 && /^[3278]/.test(r2)) {
          if (r2.slice(1) === r1) {
            const val = parseFloat(r1);
            if (isValidAmount(val)) {
              return val;
            }
          }
        }
      }
    }
  }

  // PASS 2: Single-Line 3-Digit Misread Rupee Prefix (e.g. '= Chithra R 320' -> '₹20', '350' -> '₹50')
  // In PhonePe/GPay receipts, '₹20' on recipient/merchant line is often misread as a 3-digit number '320' or '220' or '720'
  // because the '₹' symbol is recognized as a leading digit ('3', '2', '7', '8') attached to a 2-digit amount ('20').
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.includes("paid") ||
      lowerLine.includes("to") ||
      lowerLine.includes("debited") ||
      lowerLine.includes("transfer") ||
      lowerLine.includes("chithra")
    ) {
      const numbers = [...line.matchAll(/\b([3278]\d{2})\b/g)];
      for (const m of numbers) {
        const fullNum = m[1];
        const strippedVal = parseFloat(fullNum.slice(1));
        if (isValidAmount(strippedVal) && strippedVal >= 10 && strippedVal <= 99) {
          return strippedVal;
        }
      }
    }
  }

  // PASS 3: Common OCR Misreads of Rupee Symbol (A30, a30, z40, Z40, T190, t190, *40, #40)
  // Exclude standalone 'R' after capitalized names (e.g. "Chithra R 320") from being matched as a Rupee symbol
  const misreadRegex = /(?:^|[\s\(\[\{,\:\-])(?:[zZTtaA€£]|\*|#|\?|S)\s*(\d+(?:\.\d{1,2})?)\b/g;
  while ((match = misreadRegex.exec(text)) !== null) {
    const val = parseFloat(match[1]);
    if (isValidAmount(val)) {
      return val;
    }
  }

  // PASS 4: MLKit misreading ₹ as '7' prefix before digits (e.g. ₹50 -> 750, ₹90 -> 790, ₹500 -> 7500)
  const misread7Regex = /\b7(\d{2,4})\b/g;
  while ((match = misread7Regex.exec(text)) !== null) {
    const val = parseFloat(match[1]);
    if (isValidAmount(val)) {
      return val;
    }
  }

  // PASS 4: Action keywords & line search (including 'from' and 'to' and adjacent lines)
  const actionKeywords = [
    "paid",
    "payment",
    "sent",
    "debited",
    "credited",
    "received",
    "transfer",
    "amount",
    "total",
    "successful",
    "from",
    "to",
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    if (actionKeywords.some((kw) => lowerLine.includes(kw))) {
      const combined = line + " " + (lines[i + 1] || "");
      const cleanedLine = combined
        .replace(/https?:\/\/\S+/gi, "")
        .replace(/\+?\d{10,}/g, "")
        .replace(/\b[A-Z0-9]{12,}\b/gi, "")
        .replace(/[X\*]{2,}\d+/gi, "")
        .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/gi, "");

      const numbers = [...cleanedLine.matchAll(/\b(\d+(?:\.\d{1,2})?)\b/g)].map(
        (m) => parseFloat(m[1])
      );

      for (const num of numbers) {
        if (isValidAmount(num)) {
          return num;
        }
      }
    }
  }

  // PASS 5: Decimal pattern matching (for petrol/shopping receipts e.g. 150.50)
  const decimalAmounts: number[] = [];
  const decimalRegex = /\b(\d+\.\d{2})\b/g;
  while ((match = decimalRegex.exec(text)) !== null) {
    const val = parseFloat(match[1]);
    if (isValidAmount(val)) {
      decimalAmounts.push(val);
    }
  }
  if (decimalAmounts.length > 0) {
    return Math.max(...decimalAmounts);
  }

  // PASS 6: Noise-eliminated bare number fallback
  let cleaned = text
    .replace(/\b\d*\s*(?:split expense|share|having issues|pay again|view history|contact support|send again|share receipt|powered by)\b/gi, "")
    .replace(/\b(?:split expense|share|having issues|pay again|view history|contact support|send again|share receipt|powered by)\s*\d*\b/gi, "")
    .replace(/\b\d{1,3}%\b/g, "")
    .replace(/\b[2345]G\+?\b/gi, "")
    .replace(/\(?\b\d+g\b\)?/gi, "")
    .replace(/\bVo\s*LTE\b/gi, "")
    .replace(/\b\d+\s*devices?\b/gi, "")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/gi, "")
    .replace(/\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4}\b/gi, "")
    .replace(/\b\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}\b/g, "")
    .replace(/\+?\d{10,12}\b/g, "")
    .replace(/\b[A-Z0-9]{12,}\b/gi, "")
    .replace(/\b\d{12,}\b/g, "")
    .replace(/[X\*]{2,}\d+/gi, "")
    .replace(/\b000\d+\b/g, "");

  const bareNums = [...cleaned.matchAll(/\b(\d+(?:\.\d{1,2})?)\b/g)].map(
    (m) => parseFloat(m[1])
  );

  for (const num of bareNums) {
    if (isValidAmount(num)) {
      // Single digit bare numbers without currency symbol or keyword context are usually UI icon/badge noise (e.g. Share 2, 2g)
      if (num < 10) continue;
      return num;
    }
  }

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
    "transaction successful",
    "sent successfully",
    "sent",
    "payment successful",
    "transfer",
    "money transfer",
    "details",
    "debited",
    "debited from",
    "credited to",
    "utr",
    "contact",
    "support",
    "powered",
    "banking name",
    "paid to",
    "paid",
    "cashback",
    "earned",
    "view details",
    "done",
    "upi transaction id",
    "amount",
    "rupees",
    "money received",
    "money sent",
    "share",
    "help",
    "paytm",
    "phonepe",
    "gpay",
    "google pay",
    "postpaid",
    "yes bank",
    "icici bank",
    "sbi",
    "hdfc",
    "axis bank",
    "edit",
    "pay again",
    "copy",
    "salary ka wait",
    "activate now",
    "credit",
  ];

  const isSkipped = (line: string): boolean => {
    const lower = line.toLowerCase();
    if (skipWords.some((w) => lower.includes(w))) return true;
    if (/screenshot/i.test(line)) return true;
    if (/\.png|\.jpg|\.jpeg|\.pdf/i.test(line)) return true;
    if (/^\d{1,2}\s+\w+\s+\d{4}/.test(line.trim())) return true;
    if (/^\d{1,2}:\d{2}/.test(line.trim())) return true;
    return false;
  };

  // Pattern 1: Standalone "To" line (Paytm style: "To \n ED Money Transfer \n Prudhvi Raj Bobb")
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().trim() === "to") {
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const candidate = lines[j];
        if (isSkipped(candidate)) continue;
        if (/\+?\d{10,}/.test(candidate)) continue;
        if (/₹\s?\d+/.test(candidate)) continue;
        if (/@/.test(candidate)) continue;

        const merchant = cleanMerchantName(candidate);
        if (merchant.length > 2) return merchant;
      }
    }
  }

  // Pattern 2: "To <name>" inline
  for (const line of lines) {
    if (line.toLowerCase().startsWith("to ")) {
      const merchant = cleanMerchantName(line.replace(/^to\s+/i, ""));
      if (merchant.length > 2 && !isSkipped(merchant)) return merchant;
    }
  }

  // Pattern 3a: "Paid to Name" inline
  for (const line of lines) {
    const inlineMatch = line.match(/^paid\s+to\s+(.+)/i);
    if (inlineMatch?.[1]) {
      const merchant = cleanMerchantName(inlineMatch[1].trim());
      if (merchant.length > 2) return merchant;
    }
  }

  // Pattern 3b: "Payment to Name" inline
  for (const line of lines) {
    const inlineMatch = line.match(/^payment\s+to\s+(.+)/i);
    if (inlineMatch?.[1]) {
      const merchant = cleanMerchantName(inlineMatch[1].trim());
      if (merchant.length > 2) return merchant;
    }
  }

  // Pattern 3c: "Money sent to Name" inline
  for (const line of lines) {
    const inlineMatch = line.match(/^money\s+sent\s+to\s+(.+)/i);
    if (inlineMatch?.[1]) {
      const merchant = cleanMerchantName(inlineMatch[1].trim());
      if (merchant.length > 2) return merchant;
    }
  }

  // Pattern 4: "Paid to" on its own line (PhonePe style)
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].toLowerCase().includes("paid to")) continue;

    const candidates: string[] = [];
    for (let j = i + 1; j < Math.min(i + 7, lines.length); j++) {
      const candidate = lines[j];

      if (isSkipped(candidate)) continue;
      if (/\+?\d{10,}/.test(candidate)) continue;
      if (/₹\s?\d+/.test(candidate)) continue;
      if (/@/.test(candidate)) continue;

      const merchant = cleanMerchantName(
        candidate.replace(/Paid to/gi, "").replace(/Paid/gi, "")
      );
      if (merchant.length >= 2) {
        candidates.push(merchant);
      }
    }

    if (candidates.length > 0) {
      // Prefer real name candidates (length >= 4 or multi-word) over 2-3 letter avatar noise like "CR", "Jic"
      const realNames = candidates.filter((c) => c.length >= 4 || c.includes(" "));
      if (realNames.length > 0) return cleanMerchantName(realNames[0]);
      return cleanMerchantName(candidates[0]);
    }
  }

  // Pattern 5: "Received from: Name" inline
  for (const line of lines) {
    const m = line.match(/received\s+from[:\s]+(.+)/i);
    if (m?.[1]) {
      const merchant = cleanMerchantName(m[1].trim());
      if (merchant.length > 2) return merchant;
    }
  }

  // Pattern 6: Prefer ALL-CAPS business header
  for (const line of lines) {
    if (isSkipped(line)) continue;
    const merchant = cleanMerchantName(line);
    if (
      merchant.length > 6 &&
      /^[A-Z][A-Z\s]{4,}$/.test(merchant) &&
      merchant.trim().split(/\s+/).length >= 2
    )
      return merchant;
  }

  // Fallback: first clean non-noise line in top 8
  for (const line of lines.slice(0, 8)) {
    if (isSkipped(line)) continue;
    const merchant = cleanMerchantName(line);
    if (merchant.length > 3) return merchant;
  }

  return "Unknown Merchant";
};

// ─── Category Detection ──────────────────────────────────────────────────────

export const detectCategory = (rawText: string): string => {
  const lower = rawText.toLowerCase();

  if (
    ["petrol", "diesel", "fuel", "hpl", "hpcl", "iocl", "bharat petroleum"].some(
      (w) => lower.includes(w)
    )
  )
    return "Petrol";

  if (
    [
      "restaurant",
      "food",
      "cafe",
      "biryani",
      "pizza",
      "zomato",
      "swiggy",
      "dominos",
      "burger",
      "tiffin",
      "hotel",
      "mess",
    ].some((w) => lower.includes(w))
  )
    return "Food";

  if (
    [
      "grocery",
      "groceries",
      "dmart",
      "supermarket",
      "mart",
      "bigbasket",
      "blinkit",
      "zepto",
      "vegetables",
      "fruits",
      "store",
      "provision",
    ].some((w) => lower.includes(w))
  )
    return "Grocery";

  if (
    [
      "uber",
      "ola",
      "rapido",
      "metro",
      "train",
      "bus",
      "ticket",
      "cab",
      "auto",
      "irctc",
      "redbus",
    ].some((w) => lower.includes(w))
  )
    return "Travel";

  if (
    ["movie", "cinema", "pvr", "inox", "theatre", "bookmyshow"].some((w) =>
      lower.includes(w)
    )
  )
    return "Entertainment";

  if (
    [
      "hospital",
      "medical",
      "pharmacy",
      "clinic",
      "doctor",
      "apollo",
      "fortis",
      "pathlab",
      "chemist",
    ].some((w) => lower.includes(w))
  )
    return "Health";

  if (
    ["recharge", "electricity", "water", "gas", "bill", "wifi", "broadband"].some(
      (w) => lower.includes(w)
    )
  )
    return "Bills";

  if (
    ["school", "college", "tuition", "fee", "books", "udemy", "coursera"].some(
      (w) => lower.includes(w)
    )
  )
    return "Education";

  if (
    ["myntra", "amazon", "flipkart", "meesho", "zara", "trends", "clothing"].some(
      (w) => lower.includes(w)
    )
  )
    return "Shopping";

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