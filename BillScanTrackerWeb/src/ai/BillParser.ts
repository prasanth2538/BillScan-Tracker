export interface ParsedBill {
  amount: number;
  merchant: string;
  category: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const cleanName = (name: string): string => {
  let cleaned = name
    .replace(/^[A-Z]{2}\)\s*/i, "")
    .replace(/\(.*?\)/g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length >= 1 && !/^\d+$/.test(w));
  return words.join(" ").trim();
};

const cleanMerchantName = (rawName: string): string => {
  if (/\b(?:save\s+expense|retake\s+photo|retake|scan\s+bill|confidence|raw\s+ocr|merchant|category|split\s+this\s+payment|split\s+payment|split\s+this\s+bill|split\s+bill|split\s+expense|split\s+with\s+friends|pay\s+again|share\s+receipt|view\s+details|check\s+balance|total\s+qty|toral\s+qty|total\s+quantity|total\s+items?)\b/i.test(rawName)) {
    return "";
  }
  let cleanedRaw = rawName
    .replace(/^[Q@#%\*\$\+\-\=\<\>\!\?\(\)\[\]\{\}\\\/]+/gi, "")
    .replace(/\b(?:pvt|private)\s*\.?\s*(?:ltd|limited)\.?\b/gi, "")
    .replace(/\b(?:ltd|limited|inc|corp|corporation|llc)\.?\b/gi, "")
    .trim();
  let name = cleanName(cleanedRaw);

  // Filter out 1-2 letter avatar icon noise (e.g. "BA", "CR", "VK", "AK", "AB")
  if (/^[A-Z]{1,2}$/.test(name)) {
    return "";
  }

  // Strip single-letter logo OCR artifact attached to start of uppercase word (e.g. "QTRENDS" -> "TRENDS")
  if (/^[QXZ][A-Z]{3,}/.test(name) && !/^(PVR|INOX|HDFC|ICICI|BHIM|AMAZON|TRENDS|DMART)/i.test(name)) {
    const stripped = name.replace(/^[QXZ](?=[A-Z]{3,})/g, "");
    if (stripped.length >= 3) {
      name = stripped;
    }
  }

  // Filter out single-word garbled OCR noise (e.g. "dignll", "xkyz", "sf0s5s2c12r")
  if (!name.includes(" ") && name.length >= 4) {
    if (/[bcdfghjklmnpqrstvwxz]{4,}/i.test(name) || /\d+[a-z]{2,}/i.test(name) || /[a-z]{2,}\d+/i.test(name)) {
      return "";
    }
  }

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

    // Strip leading single-letter logo OCR artifact if followed by a real word (e.g. "A TRENDS" -> "Trends")
    // EXCEPT when the letter is 'D' followed by 'Mart' (e.g. "D Mart", "D Mart Supermarket")
    if (words[0].length === 1 && words.length >= 2 && words[1].length >= 3) {
      if (!/^d$/i.test(words[0]) || !/^mart$/i.test(words[1])) {
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
  const m = rawText.match(/rupees?\s+([a-z0-9\s\r\n,\.-]+?)(?:\s+only|\)|$)/i);
  if (!m) return 0;

  const phrase = m[1].trim();
  const digitMatch = phrase.match(/(\d+(?:\.\d{1,2})?)/);
  if (digitMatch) {
    const val = parseFloat(digitMatch[1]);
    if (isValidAmount(val)) return val;
  }

  const rawPhrase = phrase.toLowerCase().replace(/[\r\n,\.-]+/g, " ");
  const paiseMatch = rawPhrase.match(/^(.*?)(?:\s+and\s+|\s+)?(\w+)\s+paise/i);

  let rupeesPhrase = rawPhrase;
  let paiseVal = 0;

  if (paiseMatch) {
    rupeesPhrase = paiseMatch[1];
    const paiseWord = paiseMatch[2];
    let pTemp = 0;
    for (const w of paiseWord.split(/\s+/)) {
      if (NUMBER_WORDS[w] !== undefined) pTemp += NUMBER_WORDS[w];
    }
    if (pTemp > 0 && pTemp < 100) {
      paiseVal = pTemp / 100;
    }
  }

  const words = rupeesPhrase.split(/\s+/).filter(Boolean);
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
  total += temp + paiseVal;
  return isValidAmount(total) ? total : 0;
};

// Standardize currency text & clean formatting (e.g. ₹1,250 -> ₹1250)
export const normalizeCurrencyText = (rawText: string): string => {
  let text = rawText
    .replace(/\bRs\./gi, "₹")
    .replace(/\bRs\b/gi, "₹")
    .replace(/\bINR\b/gi, "₹")
    .replace(/\bRe\./gi, "₹")
    .replace(/\bRe\b/gi, "₹")
    .replace(/\bRupees?\b/gi, "₹")
    .replace(/₹\./g, "₹");

  // Remove top phone status bar clock & notification noise (e.g. "10:13min", "1419 @ 9 mK", "10:5 ! m in H", "14:19", "09:02", "52 m [OF RR RFE")
  text = text
    .replace(/^\s*\d{3,4}\s*(?=[@\$\|\*\#\%\s]|\n|$)/gi, "")
    .replace(/^\s*\d{1,2}:\d{2}[^\n]*/gmi, "")
    .replace(/\b\d{1,2}:\d{2}(?:min|mins|m|sec|secs|s|hrs|hr|am|pm)?\b/gi, "")
    .replace(/^\s*\d{1,2}\s+Oe\b[^\n]*/gmi, "")
    .replace(/\b\d{1,2}\s+Oe\b/gi, "")
    // Strip "NN m ..." lines (clock time shown as "52 m" or "09 m" with status bar icons after)
    .replace(/^\s*\d{1,2}\s+m\b[^\n]*/gmi, "")
    .replace(/\bMID\b/gi, "")
    // Strip navigation-arrow header lines from UPI apps (e.g. "< < 63" in SuperMoney).
    // These are back-button UI fragments followed by a status-bar number (battery %, etc.)
    // and must be removed before amount extraction so the digit doesn’t spoof the amount.
    .replace(/^\s*(?:<\s*)+\d{1,3}\b[^\n]*$/gmi, "");


  // ⚠️ IMPORTANT: Strip cashback/reward lines BEFORE the "$X L" → "₹X00" substitution.
  // On web Tesseract OCR, "$2 L ®" (which represents ₹200) and "You earned ₹4.0 cashback"
  // frequently collapse onto the same OCR line. If cashback removal runs AFTER the $X L
  // substitution, the converted ₹200 gets wiped together with the cashback text.
  // By removing cashback content first, the clean "$2 L" fragment survives for substitution.
  text = text
    .replace(/^.*?\b(?:cashback|earned\s+cashback|you\s+earned|scratch\s*card|reward\s*earned)\b.*$/gmi, "")
    .replace(/₹?\s*\d+(?:\.\d{1,2})?\s*cashback\b/gi, "");

  // Handle Google Sans font OCR misreads where '30' or '₹30' is recognized as 'po', '= po', '>>po', 'so', 'p0', 's0'
  text = text
    .replace(/(?:^|\s)(?:=|>|>>|¢|~|\*|#|\+)?\s*po\b/gi, " 30")
    .replace(/(?:^|\s)(?:=|>|>>|¢|~|\*|#|\+)?\s*so\b/gi, " 30")
    .replace(/(?:^|\s)(?:=|>|>>|¢|~|\*|#|\+)?\s*p0\b/gi, " 30")
    .replace(/(?:^|\s)(?:=|>|>>|¢|~|\*|#|\+)?\s*s0\b/gi, " 30")
    .replace(/\bp(\d{1,4})\b/gi, "3$1");

  // Handle Google Pay bold font misreads in Tesseract OCR.
  // Common misreads: 6→p/b (bold 6 resembles p or b), 5→L/S (bold 5 resembles L or S).
  // ₹65  → "+p L -"  or "+b L -"  or "+p S -"  or "+b S -"   (p/b=6, L/S=5)
  // ₹650 → "+p L O" → after p+L rule: "₹65 O" → existing \d\sO rule: "₹650" ✓
  // Do NOT consume rest of line ([^\n]*) here so chained O/D chars still work.
  text = text
    .replace(/(?:^|[\s])(?:[+\-*#$>@¢~]{0,3}\s*)[pb]\s+[LS]\b/gim, " ₹65");

  // Handle Google Sans font OCR misreads in Google Pay / Paytm screenshots (e.g. ₹200 -> "$2 L ®", "₹2 L")
  // MUST require explicit $ or ₹ currency symbol prefix so item units like "1L" (1 Litre) are not misread as ₹100
  text = text
    .replace(/(?:^|\s)[\$₹]\s*(\d{1,4})\s*L\b/gi, (_, d) => ` ₹${d}00`)
    .replace(/\b(\d{1,4})[OooD]{4}\b/g, "$10000")  // ₹10000 (e.g. 1OOOO)
    .replace(/\b(\d{1,4})[OooD]{3}\b/g, "$1000")   // ₹1000  (e.g. 1OOO)
    .replace(/\b(\d{1,4})[OooD]{2}\b/g, "$100")    // ₹100,200.. (e.g. 2OO)
    .replace(/\b(\d{1,4})[OooD]\b/g, "$10")        // ₹10,20..   (e.g. 2O)
    .replace(/\b(\d{1,4})\s+[OooD]\s+[OooD]\s+[OooD]\b/g, "$1000") // 1 O O O
    .replace(/\b(\d{1,4})\s+[OooD]\s+[OooD]\b/g, "$100")            // 2 O O
    .replace(/\b(\d{1,4})\s+[OooD]\b/g, "$10");                     // 2 O



  // Remove Bank Logo & Copy Button Icon OCR noise (e.g. [60 | Indian Overseas Bank, [30 | SBI, (5), ($5), (C], (m))
  text = text
    .replace(/\[\s*\d+\s*[\|\]]?\s*/gi, "")
    .replace(/\b\d+\s*\|\s*/gi, "")
    .replace(/[\(\[]\s*[\$\#\*\@\~₹]?\s*[0-9a-zA-Z]{1,2}\s*[\)\]]/gi, "");

  // Remove masked bank account / card numbers (e.g. XXXXXXXXX000189, XXXXXXX189, XXXX189, ****0189, XX189)
  text = text
    .replace(/[Xx\*]{2,}\s*\d+/g, "")
    .replace(/\b[Xx\*]+\d+\b/gi, "")
    .replace(/\b[Xx\*]{2,}[0-9a-zA-Z]+\b/gi, "");

  // Remove Bill No, Invoice No, Token No, Order No, Table No, Ref No, Receipt No (e.g. Bill No.: 57833, BII No.: 57833, Token No.: 28, Table No.: D10, Bill No : MRI25-25/88412)
  text = text
    .replace(/\b(?:bill|bll|bii|invoice|inv|token|order|table|kot|ref|txn|receipt)\s*(?:no|number|num|#|\.)?[\s:]*[a-zA-Z0-9\-\/]+\b/gi, "")
    .replace(/^\s*(?:bill|bll|bii|invoice|inv|token|order|table|kot|ref|txn|receipt)\b[^\n]*$/gmi, "")
    .replace(/\b(?:gstin|gitin|gst|fssai|cin)\s*:?\s*[0-9A-Za-z\-\/]+\b/gi, "")
    .replace(/\b(?:ph|phone|mob|mobile|tel|contact)\s*:?\s*[\d\s-]{6,15}\b/gi, "")
    .replace(/\b(?:chennai|pincode|pin|zip)?[\s-]*6\d{5}\b/gi, "");

  // Remove Transaction IDs, UTR numbers, UPI reference IDs (e.g. T2608011927222819802318, UTR: 584485129120)
  text = text
    .replace(/\bT\d{14,}\b/gi, "")
    .replace(/\bUTR\s*:\s*\d+/gi, "");

  // Remove UPI IDs and handles that contain numbers (e.g. srirammandapaka2005@oksbi, 9876543210@ybl, user123@paytm, paytm.s2er74 u@pty)
  text = text
    .replace(/\b(?:paytm|gpay|phonepe|bhim)\.[a-zA-Z0-9\.\-_]+(?:\s+[a-zA-Z0-9]+)?\s*@\s*[a-zA-Z0-9\.\-_]+/gi, "")
    .replace(/\b(?:paytm|gpay|phonepe|bhim)\.[a-zA-Z0-9\.\-_]+\b/gi, "")
    .replace(/\b[a-zA-Z0-9\.\-_]+\s*@\s*[a-zA-Z0-9\.\-_]+\b/gi, "")
    .replace(/\S+@\S+/gi, "");

  // Remove full date & time stamps (e.g. "7 Jul 2026, 10:07 pm", "14 Jul 2026", "06:41 pm", "23/D6/2025", "Tine: 11:20 AM")
  text = text
    .replace(/\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z,0-9\s:]*\b[^\n]*/gi, "")
    .replace(/\b\d{1,2}[-/\.][a-z0-9]{1,2}[-/\.]\d{2,4}\b/gi, "")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/gi, "")
    .replace(/^\s*(?:date|tine|time|dt)\s*[:\s][^\n]*$/gmi, "");

  // Convert common OCR misreads of Rupee symbol attached to numbers (e.g. Z20 -> ₹20, z20 -> ₹20, A20 -> ₹20, T20 -> ₹20, Z866.26 -> ₹866.26)
  // Exclude standalone 'R' / 'r' after words (e.g. "Chithra R 320") so surname initial R is not converted to a Rupee symbol
  text = text.replace(/(?:^|[\s\(\[\{,:\-])(?:[zZTtaA€£eExXsSkK]|\*|#|\?|S)[\.:\-\=\s]*(\d+(?:\.\d{1,2})?)\b/g, " ₹$1");

  // Handle @ as ₹ symbol misread (e.g. "@15" → "₹15").
  // UPI IDs (user@bank) are already stripped above so remaining @ is non-email context.
  text = text.replace(/(?:^|[\s+*#>])@\s*(\d+(?:\.\d{1,2})?)\b/g, " ₹$1");

  // PhonePe / GPay custom Rupee symbol font misread where ₹ before 2-digit amount is read as '7' (e.g. 790 -> ₹90, 780 -> ₹80, 750 -> ₹50)
  const isUPI = /(?:payment|transaction)\s+successful|paid\s+to|money\s+sent|completed|^to\s+|phonepe|gpay|paytm/i.test(rawText);
  if (isUPI) {
    text = text.replace(/(?:^|[\s\n])7([1-9]\d)\b/g, " ₹$1");
  }

  // Remove commas inside numbers
  text = text.replace(/(₹|\b\d{1,3}),(\d{3})/g, "$1$2");
  text = text.replace(/(\d+),(\d{3})/g, "$1$2");

  return text;
};

// ─── UPI Payment Context Extractor ──────────────────────────────────────────
// Safety-net for UPI receipts where the large bold amount couldn't be decoded by
// the symbol/keyword passes. Finds "Payment successful" and applies targeted
// character-level OCR corrections only to the lines immediately following it.

const UPI_SKIP_RE = /cashback|earned|reward|scratch|transaction\s*id|view\s*details|powered|pay\s*again|done\b|%\b|\d+%|debited\s*from|account|transfer\s*details|utr/i;
const UPI_BREAK_RE = /\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\d{1,2}:\d{2}/i;

const correctOCRCharsForAmount = (line: string): string =>
  line
    // Remove masked bank account / card numbers & UPI handles (e.g. XXXXXXXXX000189, paytm.s2er74u)
    .replace(/[Xx\*]{2,}\s*\d+/g, "")
    .replace(/\b[Xx\*]+\d+\b/gi, "")
    .replace(/\b(?:paytm|gpay|phonepe|bhim)\.[a-zA-Z0-9\.\-_]+\b/gi, "")
    // Rupee symbol misread as ?, z, Z, T before amount (e.g. "z20" -> "₹20")
    .replace(/(?:^|\s)[\?zZTt]\s*(\d{1,4}(?:\.\d{1,2})?)\b/g, " ₹$1")
    // O, o, D → 0 when adjacent to digits
    .replace(/(\d)[OoD](\d)/g, "$10$2")
    .replace(/(\d)[OoD](\s|$)/g, "$10$2")
    .replace(/(^|\s)[OoD](\d)/g, "$10$2")
    // S, s → 5 when between/after digits
    .replace(/(\d)[Ss](\d)/g, "$15$2")
    .replace(/(\d)[Ss](\s|$)/g, "$15$2")
    // l, I → 1 between digits
    .replace(/(\d)[lI](\d)/g, "$11$2")
    // B → 8 between digits
    .replace(/(\d)B(\d)/g, "$18$2")
    // p, b → 6 before digit or L/S (bold 6 misread)
    .replace(/\b[pb]([0-9])/gi, "6$1")
    .replace(/\b[pb]\s+[LS]\b/gi, "65")
    // SuperMoney bold font misreads: Tesseract reads ₹ as "+ @" and 1+5 as "s w".
    //   "@ s"  → "15"  (@ represents ₹ or 1, s = 5)
    //   "@<N>" → "1N"  (@ = 1 when before a single digit)
    .replace(/@\s*[Ss]\b/g, "15")
    .replace(/@\s*([0-9])/g, "1$1")
    // Currency symbol misreads at start of number (@ also acts as ₹)
    .replace(/(?:^|\s)[#¥€£*~^@]\s*(\d+(?:\.\d{1,2})?)/g, " ₹$1")
    // Separate concatenated numbers attached to letters without space (e.g. "Total Amount316.46" -> "Total Amount 316.46")
    .replace(/([a-zA-Z])(\d+(?:\.\d{1,2})?)/g, "$1 $2");

const extractUPIPaymentAmount = (normalizedText: string): number => {
  const lines = normalizedText.split("\n").map((l) => l.trim());
  const successIdx = lines.findIndex((l) =>
    /(?:payment|transaction)\s+successful|paid\s+to\b|money\s+sent|sent\s+successfully|\bcompleted\b/i.test(l)
  );
  if (successIdx < 0) return 0;

  const startIdx = Math.max(0, successIdx - 5);
  const endIdx = Math.min(lines.length, successIdx + 14);
  const upiLines = lines.slice(startIdx, endIdx);

  // 1. Cross-line suffix matching:
  // Handles cases where top amount line is read as "790" (misread Rupee symbol + 90)
  // while bottom debited/account line is read as "90" or "₹90".
  const numbersInBlock: { val: number; raw: string; line: string }[] = [];
  for (const l of upiLines) {
    if (UPI_SKIP_RE.test(l)) continue;
    const cleanL = l
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/\+?\d{10,}/g, "")
      .replace(/[X\*]{2,}\d+/g, "")
      .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/gi, "");

    const matches = [...cleanL.matchAll(/(?:₹\s*(\d+(?:\.\d{1,2})?)|\b(\d+(?:\.\d{1,2})?)\b)/g)];
    for (const m of matches) {
      const rawStr = m[1] || m[2];
      const numVal = parseFloat(rawStr);
      if (isValidAmount(numVal)) {
        numbersInBlock.push({ val: numVal, raw: rawStr, line: l });
      }
    }
  }

  for (let i = 0; i < numbersInBlock.length; i++) {
    for (let j = i + 1; j < numbersInBlock.length; j++) {
      const n1 = numbersInBlock[i];
      const n2 = numbersInBlock[j];
      if (n1.val === n2.val) continue;

      const r1 = n1.raw;
      const r2 = n2.raw;

      // Case A: r1="790", r2="90" (r1 starts with misread Rupee digit 7/3/2, r1.slice(1) === r2)
      if (r1.length === r2.length + 1 && /^[7328]/.test(r1) && r1.slice(1) === r2) {
        const val = parseFloat(r2);
        if (isValidAmount(val) && val >= 10) return val;
      }
      // Case B: r2="790", r1="90"
      if (r2.length === r1.length + 1 && /^[7328]/.test(r2) && r2.slice(1) === r1) {
        const val = parseFloat(r1);
        if (isValidAmount(val) && val >= 10) return val;
      }
    }
  }

  // 2. Try direct ₹ symbol match first
  for (let i = startIdx; i < endIdx; i++) {
    const line = lines[i];
    if (!line || UPI_SKIP_RE.test(line)) continue;

    const directMatch = line.match(/₹\s*(\d+(?:\.\d{1,2})?)/);
    if (directMatch) {
      const v = parseFloat(directMatch[1]);
      if (isValidAmount(v)) return v;
    }
  }

  // 3. Standalone bare number check on/after success line
  for (let i = Math.max(0, successIdx - 1); i < endIdx; i++) {
    const line = lines[i];
    if (!line || UPI_SKIP_RE.test(line)) continue;

    const corrected = correctOCRCharsForAmount(line);
    const nums = [...corrected.matchAll(/\b(\d{2,7}(?:\.\d{1,2})?)\b/g)];
    for (const m of nums) {
      const v = parseFloat(m[1]);
      if (isValidAmount(v)) {
        // Handle PhonePe/Paytm custom Rupee font misread where ₹ is read as '7' prefix (e.g. 790 -> 90, 750 -> 50)
        if (/^7[1-9]\d$/.test(m[1])) {
          const stripped = parseFloat(m[1].slice(1));
          if (isValidAmount(stripped) && stripped >= 10) return stripped;
        }
        return v;
      }
    }
  }
  return 0;
};

// ─── Amount Extraction ──────────────────────────────────────────────────────

export const extractAmount = (rawText: string): number => {
  if (!rawText?.trim()) return 0;

  // PASS 0: Words check (e.g., "Rupees Fifty Only" -> 50)
  const wordAmount = extractAmountFromWords(rawText);
  if (wordAmount > 0) return wordAmount;

  const text = normalizeCurrencyText(rawText);
  const lines = text.split("\n");

  // PASS 0.1: UPI Payment context extractor (runs on normalized text so cashback/noise
  // already stripped). Applies per-character OCR corrections on lines after "Payment successful".
  const upiAmount = extractUPIPaymentAmount(text);
  if (upiAmount > 0) return upiAmount;


  // PASS 0.4: High-Priority Explicit Final Total Line Match (Total Amount, Grand Total, Net Amount, Total Payable)
  const finalTotalKeyRegex = /(?:total\s*amount|grand\s*total|net\s*amount|total\s*payable|total\s*pay|final\s*amount|total\s*due|bill\s*total|total\s*(?:rs\.?|inr|₹))/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (finalTotalKeyRegex.test(line) && !/sub\s*total/i.test(line)) {
      // 1. First search ON or AFTER the TOTAL line (up to 25 lines ahead)
      const forwardText = lines.slice(i, Math.min(lines.length, i + 25)).join(" ");
      const forwardRupees = [...forwardText.matchAll(/(?:₹\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*₹(?!\s*\d))/g)]
        .map((m) => parseFloat(m[1] || m[2]))
        .filter((n) => isValidAmount(n));
      if (forwardRupees.length > 0) return Math.max(...forwardRupees);

      const forwardDecimals = [...forwardText.matchAll(/\b(\d+(?:\.\d{1,2}))\b/g)]
        .map((m) => parseFloat(m[1]))
        .filter((n) => isValidAmount(n) && !/2\.5|5|12|18|28/.test(String(n)));
      if (forwardDecimals.length > 0) return Math.max(...forwardDecimals);

      // 2. Look in surrounding total block (excluding unpunctuated 5-digit item numbers >= 10000)
      const combined = lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 35)).join(" ");
      const rupeeNumbers = [...combined.matchAll(/(?:₹\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*₹(?!\s*\d))/g)]
        .map((m) => parseFloat(m[1] || m[2]))
        .filter((n) => isValidAmount(n));
      if (rupeeNumbers.length > 0) return Math.max(...rupeeNumbers);

      const validDecimals = [...combined.matchAll(/\b(\d+\.\d{2})\b/g)]
        .map((m) => parseFloat(m[1]))
        .filter((n) => isValidAmount(n));
      if (validDecimals.length > 0) return Math.max(...validDecimals);
    }
  }

  // PASS 0.5: Standalone "Total" (excluding "Sub Total") line match
  const standaloneTotalKeyRegex = /(?<!sub\s*)(?<!sub)\btotal\b/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (standaloneTotalKeyRegex.test(line) && !/sub\s*total/i.test(line)) {
      const forwardText = lines.slice(i, Math.min(lines.length, i + 25)).join(" ");
      const forwardRupees = [...forwardText.matchAll(/(?:₹\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*₹(?!\s*\d))/g)]
        .map((m) => parseFloat(m[1] || m[2]))
        .filter((n) => isValidAmount(n));
      if (forwardRupees.length > 0) return Math.max(...forwardRupees);

      const forwardDecimals = [...forwardText.matchAll(/\b(\d+(?:\.\d{1,2}))\b/g)]
        .map((m) => parseFloat(m[1]))
        .filter((n) => isValidAmount(n));
      if (forwardDecimals.length > 0) return Math.max(...forwardDecimals);

      const combined = lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 35)).join(" ");
      const validDecimals = [...combined.matchAll(/\b(\d+\.\d{2})\b/g)]
        .map((m) => parseFloat(m[1]))
        .filter((n) => isValidAmount(n));
      if (validDecimals.length > 0) return Math.max(...validDecimals);
    }
  }

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

  const rupeeAfterRegex = /(\d+(?:\.\d{1,2})?)\s*₹(?!\s*\d)/g;
  while ((match = rupeeAfterRegex.exec(text)) !== null) {
    const val = parseFloat(match[1]);
    if (isValidAmount(val)) {
      rupeeMatches.push(val);
    }
  }

  if (rupeeMatches.length > 0) {
    // On bills with multiple item prices/quantities (e.g. adult 2 280.00, Total Amount 660.80),
    // prefer multi-digit / decimal amounts and select the maximum total amount rather than item quantities.
    const validRupees = rupeeMatches.filter((r) => r >= 10 || r % 1 !== 0);
    if (validRupees.length > 0) {
      return Math.max(...validRupees);
    }
    return Math.max(...rupeeMatches);
  }

  // PASS 1.5 & PASS 2: Preserving valid 3-digit amounts (e.g. ₹780, ₹790, ₹750) in UPI context without truncating leading digits.

  // PASS 3: Common OCR Misreads of Rupee Symbol (A30, a30, z40, Z40, T190, t190, *40, #40)
  // Exclude standalone 'R' after capitalized names (e.g. "Chithra R 320") from being matched as a Rupee symbol
  const misreadRegex = /(?:^|[\s\(\[\{,\:\-])(?:[zZTtaA€£]|\*|#|\?|S)\s*(\d+(?:\.\d{1,2})?)\b/g;
  while ((match = misreadRegex.exec(text)) !== null) {
    const val = parseFloat(match[1]);
    if (isValidAmount(val)) {
      return val;
    }
  }

  // PASS 4: (Pass removed to prevent valid amounts like 790 or 750 from being misread as 90 or 50)

  // PASS 4.5: Action keywords & line search (using exact word boundary matching)
  const actionKeywords = [
    /\bpaid\b/i,
    /\bpayment\b/i,
    /\bsent\b/i,
    /\bdebited\b/i,
    /\bcredited\b/i,
    /\breceived\b/i,
    /\btransfer\b/i,
    /\bamount\b/i,
    /\btotal\b/i,
    /\bsuccessful\b/i,
    /\bfrom\b/i,
    /\bto\b/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignore table headers like "Ticket Type Qty Amount", "Qty Amount", "Rate Amount" or standalone "Item", "Qty", "Amount"
    if (/qty\s+amount|rate\s+amount|price\s+amount|ticket\s+type/i.test(line)) {
      continue;
    }

    if (/^(?:item|qty|quantity|rate|price|amount)$/i.test(line.trim())) {
      const surrounding = lines.slice(Math.max(0, i - 4), Math.min(lines.length, i + 5)).join(" ");
      if (/\b(?:item|qty|quantity|rate|price|ticket)\b/i.test(surrounding)) {
        continue;
      }
    }

    if (actionKeywords.some((regex) => regex.test(line))) {
      const combined = lines.slice(i, i + 4).join(" ");
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
          // Skip single-digit noise (e.g. stray '3' or '2' quantity)
          if (num < 10) continue;
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
    "movie",
    "movie ticket",
    "cinema",
    "cinema ticket",
    "theatre",
    "theater",
    "cgst",
    "sgst",
    "igst",
    "vat",
    "gst",
    "subtotal",
    "sub total",
    "booking id",
    "completed",
    "get them talking",
    "just do it",
    "welcome",
    "welcome to",
    "thank you",
    "visit again",
    "tax invoice",
    "cash memo",
    "retail invoice",
    "invoice",
    "exchange within",
    "shopping bill",
    "send again",
    "view history",
    "split expense",
    "split this expense",
    "split this payment",
    "split payment",
    "split this bill",
    "split bill",
    "split with friends",
    "split",
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
    "indian overseas bank",
    "state bank of india",
    "bank of baroda",
    "canara bank",
    "union bank",
    "punjab national bank",
    "kotak bank",
    "federal bank",
    "central bank",
    "bank of india",
    "idbi bank",
    "edit",
    "pay again",
    "copy",
    "salary ka wait",
    "activate now",
    "credit",
    "min",
    "mins",
    "sec",
    "secs",
    "hrs",
    "device",
    "devices",
    "battery",
    "wifi",
    "volte",
    "lte",
    "having issues",
    "poweredby",
    "google transaction id",
    "google transaction",
    "transaction id",
    "save expense",
    "retake photo",
    "retake",
    "scan bill",
    "confidence",
    "raw ocr debug",
    "raw ocr",
    "merchant",
    "category",
    "total qty",
    "toral qty",
    "total quantity",
    "total count",
    "total item",
    "total items",
    "cashier",
    "biller",
    "dine in",
    "token no",
    "bill no",
    "table no",
  ];

  const isSkipped = (line: string): boolean => {
    const lower = line.toLowerCase();
    if (skipWords.some((w) => lower.includes(w))) return true;
    if (/screenshot/i.test(line)) return true;
    if (/\.png|\.jpg|\.jpeg|\.pdf/i.test(line)) return true;
    if (/^\d{1,2}\s+\w+\s+\d{4}/.test(line.trim())) return true;
    if (/^\d{1,2}:\d{2}/.test(line.trim())) return true;
    if (/^(?:min|mins|sec|secs|hr|hrs|device|devices|battery|wifi|volte|lte|status|notification|notifications|power|powered|poweredby)\b/i.test(line.trim())) return true;
    if (/^\d+\s*(?:min|mins|sec|secs|hr|hrs|device|devices|mb|gb|kb|kbs|mbs|gbs|%)\b/i.test(line.trim())) return true;
    if (/\b(?:bank|overseas|state\s*bank|baroda|canara|union\s*bank)\b/i.test(line.trim()) && /\d{3,}/.test(line.trim())) return true;
    if (/^C\|C[A-Z0-9]+/i.test(line.trim())) return true;
    if (/^[a-zA-Z\s]+[-–]\s*\d{5,6}\b/.test(line.trim())) return true;
    if (/^\d{5,6}\b/.test(line.trim())) return true;
    if (/^T\d{10,}/i.test(line.trim())) return true;
    if (/\b(?=.*\d)[A-Z0-9]{15,}\b/i.test(line.trim())) return true;
    if (/\bUTR\b/i.test(line.trim())) return true;
    if (/\bTransaction ID\b/i.test(line.trim())) return true;
    if (/^[X\*]{4,}\d+/i.test(line.trim())) return true;
    if (/^(?:cgst|sgst|igst|vat|gst|sub\s*total|total|toral|total\s*qty|toral\s*qty|total\s*items?|booking\s*id|cinema\s*ticket)\b/i.test(line.trim())) return true;
    if (/^(?:qty|quantity|items?|price|amount|cashier|biller|token|bill\s*no|bii\s*no|table\s*no|dine\s*in)\b/i.test(line.trim())) return true;
    if (/\b(?:total\s*qty|toral\s*qty|total\s*quantity|total\s*items?)\b/i.test(line.trim())) return true;
    // Skip item lines with unit quantities & OCR misreads (e.g. Rice 5kg, Sugar 1kg, Tea 250gm, Sunflower 1L, Salt 1kg, Rce Skg, Wheat Flo lkg)
    if (/\d*\s*(?:kg|skg|lkg|zkg|g|gm|gms|ml|l|ltr|pc|pcs|pack|pkt|ha)\b/i.test(line.trim())) return true;
    if (/\b(?:rice|rce|dal|toor|sugar|tea|oil|sunlower|flour|flo|salt|wheat|paneer|milk|attar|atta|masala|biscuit|noodles?)\b/i.test(line.trim())) return true;
    if (/^(?:cty|qty|rate|price|amount|\d+)+$/i.test(line.trim())) return true;
    // Skip location & address lines (e.g. Koramangala Bangalore 560034, 80 Feet Road, Ph: 080-25559876)
    if (/\b(?:bangalore|bengaluru|koramangala|indiranagar|jayanagar|whitefield|hsr|mumbai|delhi|chennai|hyderabad|pune)\b/i.test(line.trim())) return true;
    if (/\b(?:\d{6}|5600\d{2})\b/.test(line.trim())) return true;
    if (/\b(?:road|street|nagar|layout|colony|marg|cross|main|floor|suite|plot|sector|phase|pincode|pin|gstin|fssai)\b/i.test(line.trim())) return true;
    if (/^\s*(?:no\.|ph:|phone:|tel:)/i.test(line.trim())) return true;
    return false;
  };

  // Pattern 0: Cinema / Movie Ticket Title
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const movieMatch = line.match(/^movie\s*:\s*(.+)/i);
    if (movieMatch?.[1]) {
      const cleanTitle = movieMatch[1]
        .replace(/^[:\s\-\=\|\#]+/, "")
        .replace(/\(\s*\d[daD]\s*\)/i, "")
        .replace(/\b\d[daD]\b/i, "")
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .trim();
      if (cleanTitle.length > 2 && !/^(?:date|time|audi|seats?|ticket|qty|amount|cgst|sgst|igst|gst|tax|sub\s*total|total)/i.test(cleanTitle)) {
        return cleanTitle;
      }
    }
    if (/^movie\s*:?$/i.test(line)) {
      // First check for colon-prefixed title lines in MLKit output (e.g. ": Kalki 2898 AD (2D)")
      for (let j = 0; j < lines.length; j++) {
        const candidate = lines[j];
        if (candidate.startsWith(":")) {
          const rawTitle = candidate.replace(/^[:\s\-\=\|\#]+/, "").trim();
          if (
            rawTitle &&
            !isSkipped(rawTitle) &&
            !/^(?:date|time|audi|seats?|ticket|qty|amount|cgst|sgst|igst|gst|tax|sub\s*total|total|adult)/i.test(rawTitle)
          ) {
            const cleanTitle = rawTitle
              .replace(/\(\s*\d[daD]\s*\)/i, "")
              .replace(/\b\d[daD]\b/i, "")
              .replace(/[^a-zA-Z0-9\s]/g, " ")
              .trim();
            if (cleanTitle.length > 2) {
              return cleanTitle;
            }
          }
        }
      }

      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        const nextLine = lines[j];
        if (
          nextLine &&
          !isSkipped(nextLine) &&
          !/^(?:date|time|audi|seats?|ticket|qty|amount|cgst|sgst|igst|gst|tax|sub\s*total|total|adult)/i.test(nextLine.trim())
        ) {
          const cleanTitle = nextLine
            .replace(/^[:\s\-\=\|\#]+/, "")
            .replace(/\(\s*\d[daD]\s*\)/i, "")
            .replace(/\b\d[daD]\b/i, "")
            .replace(/[^a-zA-Z0-9\s]/g, " ")
            .trim();
          if (cleanTitle.length > 2) {
            return cleanTitle;
          }
        }
      }
    }
  }

  // Pattern 0.2: UPI VPA Handle Payee Anchor Detector (e.g. line before "paytm.s2er74 u@pty", "user@okaxis", "reliance@icici")
  // In UPI apps (PhonePe, GPay, Paytm, BHIM), the Payee Name immediately precedes the UPI handle (VPA)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/@/.test(line) || /\b[a-zA-Z0-9\.\-_]+\s*@\s*[a-zA-Z0-9\.\-_]+\b/i.test(line) || /\b(?:paytm|pty|gpay|ybl|oksbi|okaxis)\b/i.test(line)) {
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        const prevLine = lines[j];
        if (!prevLine || isSkipped(prevLine)) continue;
        if (/^\d+$/.test(prevLine) || /₹/.test(prevLine) || /^(?:paid\s+to|payment|transfer|details)/i.test(prevLine.trim())) continue;

        const merchant = cleanMerchantName(prevLine);
        if (merchant.length >= 3 && !/^[A-Z]{1,2}$/.test(merchant)) {
          return merchant;
        }
      }
    }
  }

  // Pattern 0.5: Banking Name inline (PhonePe verified bank name)
  for (const line of lines) {
    const bankingMatch = line.match(/banking\s*name\s*[:@\-\s]+\s*(.+)/i);
    if (bankingMatch?.[1]) {
      const cleanBankName = cleanMerchantName(bankingMatch[1].replace(/[@:\#]/g, "").trim());
      if (cleanBankName.length > 2 && !isSkipped(cleanBankName)) {
        return cleanBankName;
      }
    }
  }

  // Pattern 0.8: Fuel / Petrol Pump / Store Anchor Line Detector
  for (const line of lines.slice(0, 20)) {
    if (isSkipped(line)) continue;
    const lower = line.toLowerCase();
    if (
      /\b(?:petroleum|filling\s*station|service\s*station|petrol\s*pump|fuel|hpcl|hpl|iocl|bpcl|bharat\s*petroleum|indian\s*oil|hindustan\s*petroleum|shell|nayara|essar|d-?mart|supermarket|hypermarket|mart|bazaar)\b/i.test(
        lower
      )
    ) {
      const cleanFuel = cleanMerchantName(line);
      if (cleanFuel && cleanFuel.length >= 3 && !/^(?:petrol|diesel|fuel|item|qty|amount)\b/i.test(cleanFuel)) {
        return cleanFuel;
      }
    }
  }

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

  // Pattern 2: "To: <name>" or "To <name>" or "TO<Name>" inline
  for (const line of lines) {
    const toMatch = line.match(/^(?:to\s*:\s*|to\s+|to(?=[A-Z][a-z]{2,}|[A-Z]{3,}))(.+)/i);
    if (toMatch?.[1]) {
      const rawCandidate = toMatch[1].trim();
      if (/^https?:\/\//i.test(rawCandidate)) continue;
      if (/\.png|\.jpg/i.test(rawCandidate)) continue;
      if (/@/.test(rawCandidate)) continue;

      const merchant = cleanMerchantName(rawCandidate);
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

  // Pattern 3d: UPI VPA Handle Payee Anchor Detector (e.g. line before "paytm.s2er74 u@pty", "user@okaxis", "reliance@icici")
  // In UPI apps, the Payee Name immediately precedes the UPI handle (VPA)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/@/.test(line) || /\b[a-zA-Z0-9\.\-_]+\s*@\s*[a-zA-Z0-9\.\-_]+\b/i.test(line) || /\b(?:paytm|pty|gpay|ybl|oksbi|okaxis)\b/i.test(line)) {
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        const prevLine = lines[j];
        if (!prevLine || isSkipped(prevLine)) continue;
        if (/^\d+$/.test(prevLine) || /₹/.test(prevLine) || /^(?:paid\s+to|payment|transfer|details)/i.test(prevLine.trim())) continue;

        const merchant = cleanMerchantName(prevLine);
        if (merchant.length >= 3 && !/^[A-Z]{1,2}$/.test(merchant)) {
          return merchant;
        }
      }
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
      if (/^[A-Z]{1,2}$/.test(candidate.trim())) continue;

      const merchant = cleanMerchantName(
        candidate.replace(/Paid to/gi, "").replace(/Paid/gi, "")
      );
      if (merchant.length >= 3 && !/^[A-Z]{1,2}$/.test(merchant.trim())) {
        candidates.push(merchant);
      }
    }

    if (candidates.length > 0) {
      const fullPersonNames = candidates.filter((c) => c.trim().includes(" ") && c.trim().split(/\s+/).length >= 2);
      if (fullPersonNames.length > 0) return cleanMerchantName(fullPersonNames[0]);
      const realNames = candidates.filter((c) => c.length >= 3);
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

  // Pattern 5.8: Store / Brand / Restaurant Header Combiner & Detector
  // Matches store & restaurant names with brand keywords (e.g., "Geeraas Restaurant", "Anbu Foods", "More MEGA STORE", "DMart", "Smart Bazaar")
  const storeKeywords = /\b(?:mega\s*store|retail|supermarket|hypermarket|mart|bazaar|provision|store|groceries|super\s*market|restaurant|cafe|café|bakery|bistro|kitchen|hotel|diner|foods|sweets|canteen|mess|eatery|dining)\b/i;
  for (let i = 0; i < Math.min(25, lines.length); i++) {
    const line = lines[i];
    if (isSkipped(line)) continue;
    if (storeKeywords.test(line)) {
      const cleanStore = cleanMerchantName(line);
      if (cleanStore && cleanStore.length >= 3 && !isSkipped(cleanStore)) {
        // If line is e.g. "MEGA STORE" or "Retail", try joining with nearby clean header brand line (e.g. "More")
        if (/^(?:mega\s*store|retail|store|mart|supermarket)$/i.test(cleanStore)) {
          for (let j = Math.max(0, i - 4); j < Math.min(lines.length, i + 4); j++) {
            if (j === i) continue;
            const adjacent = lines[j];
            if (!adjacent || isSkipped(adjacent)) continue;
            const adjClean = cleanMerchantName(adjacent);
            if (adjClean && adjClean.length >= 3 && !isSkipped(adjClean) && !storeKeywords.test(adjClean)) {
              return j < i ? `${adjClean} ${cleanStore}` : `${cleanStore} ${adjClean}`;
            }
          }
        }
        return cleanStore;
      }
    }
  }

  // Pattern 6: Top header clean brand name
  for (const line of lines.slice(0, 25)) {
    if (isSkipped(line)) continue;
    if (/^\d+$/.test(line)) continue;
    const merchant = cleanMerchantName(line);
    if (
      merchant.length >= 3 &&
      !/^(?:item|qty|price|amount|date|time|bill|orion|mall|road|bangalore|address|phone|ph)\b/i.test(merchant)
    ) {
      return merchant;
    }
  }

  // Fallback: first clean non-noise line in top 30
  for (const line of lines.slice(0, 30)) {
    if (isSkipped(line)) continue;
    if (/^\d+$/.test(line)) continue;
    const merchant = cleanMerchantName(line);
    if (
      merchant.length >= 3 &&
      !/^(?:item|qty|price|amount|date|time|bill|orion|mall|road|bangalore|address|phone|ph)\b/i.test(merchant)
    ) {
      return merchant;
    }
  }

  return "Unknown Merchant";
};

// ─── Category Detection ──────────────────────────────────────────────────────

export const detectCategory = (rawText: string): string => {
  const lower = rawText.toLowerCase();

  // Entertainment checked BEFORE Travel so Cinema/Movie tickets aren't misclassified as Travel
  if (
    [
      "movie",
      "cinema",
      "pvr",
      "inox",
      "theatre",
      "theater",
      "bookmyshow",
      "kalki",
      "audi",
      "screen",
      "seats",
      "show",
    ].some((w) => lower.includes(w))
  )
    return "Entertainment";

  if (
    [
      "petrol",
      "diesel",
      "fuel",
      "hpl",
      "hpcl",
      "iocl",
      "bharat petroleum",
      "petroleum",
      "oil filling",
      "filling station",
      "gas station",
      "service station",
      "oil station",
    ].some((w) => lower.includes(w))
  )
    return "Petrol";

  if (
    [
      "grocery",
      "groceries",
      "dmart",
      "d mart",
      "d-mart",
      "supermarket",
      "hypermarket",
      "mart",
      "bazaar",
      "bigbasket",
      "blinkit",
      "zepto",
      "vegetables",
      "fruits",
      "provision",
      "store",
    ].some((w) => lower.includes(w))
  )
    return "Grocery";

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
      "uber",
      "ola",
      "rapido",
      "metro",
      "train",
      "bus",
      "cab",
      "auto",
      "irctc",
      "redbus",
      "flight",
      "airline",
      "indigo",
      "air india",
    ].some((w) => lower.includes(w))
  )
    return "Travel";

  if (
    [
      "myntra",
      "amazon",
      "flipkart",
      "meesho",
      "zara",
      "trends",
      "clothing",
      "jeans",
      "t-shirt",
      "shirt",
      "pant",
      "apparel",
      "fashion",
      "footwear",
      "shopping",
    ].some((w) => lower.includes(w))
  )
    return "Shopping";

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
    [
      "recharge",
      "electricity",
      "water bill",
      "electricity bill",
      "gas bill",
      "wifi bill",
      "broadband",
      "dth",
      "utility bill",
      "power bill",
    ].some((w) => lower.includes(w))
  )
    return "Bills";

  if (
    ["school", "college", "tuition", "fee", "books", "udemy", "coursera"].some(
      (w) => lower.includes(w)
    )
  )
    return "Education";

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