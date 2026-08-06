import re
from typing import List, Dict, Any, Optional

MERCHANT_KEYWORDS = [
  "paid to", "to", "merchant", "payee", "receiver", "shop", "store",
  "paid to:", "to:", "merchant:", "payee:", "receiver:", "shop:", "store:"
]

IGNORE_MERCHANT_TEXT = [
  "completed", "successful", "payment successful", "payment", "bill",
  "receipt", "transaction", "amount", "total", "subtotal", "date",
  "upi id", "ref no", "transaction id", "google pay", "phonepe", "paytm",
  "bhim", "cred", "bank", "account", "cinema ticket", "shopping bill",
  "tax invoice", "cash memo", "retail invoice", "invoice", "movie", "cinema", "theatre", "theater"
]

def extract_amount(items: List[Dict[str, Any]]) -> Optional[float]:
    """
    Hybrid spatial, contextual & regex amount extractor.
    Iterates over OCR items, filters noise (account/phone/transaction IDs),
    gives high priority to explicit Total Amount / Grand Total keywords,
    and selects the highest confidence/prominence candidate amount.
    """
    candidates = []

    # Keywords for total amount detection
    TOTAL_KEYWORDS = ["total amount", "grand total", "net amount", "total payable", "total due", "final amount", "total pay", "bill total"]
    SUBTOTAL_KEYWORDS = ["sub total", "subtotal"]

    for i, item in enumerate(items):
        raw_item_text = item.get("text", "").strip()
        box = item.get("box", {})
        conf = item.get("confidence", 0)

        if not raw_item_text:
            continue

        # Convert common OCR misreads of Rupee symbol (e.g., Z866.26 -> ₹866.26)
        text = re.sub(r'^[zZTtaA€£eExXsSkK@$#*?][\.:\-\=\s]*([0-9]+(?:\.[0-9]{1,2})?)', r'₹\1', raw_item_text)
        text_lower = text.lower()

        # Ignore table headers like "Ticket Type Qty Amount", "Qty Amount", "Rate Amount"
        if re.search(r'qty\s+amount|rate\s+amount|price\s+amount|ticket\s+type', text_lower):
            continue

        # Check if this item or adjacent items contain total amount keywords
        is_explicit_total = any(kw in text_lower for kw in TOTAL_KEYWORDS)
        is_subtotal = any(kw in text_lower for kw in SUBTOTAL_KEYWORDS) and not is_explicit_total
        is_standalone_total = ("total" in text_lower) and not is_explicit_total and not is_subtotal

        # Skip line if it clearly matches account numbers / transaction IDs / phone numbers
        if re.search(r'(?:txn|ref|utr|id|acc|account|date|time|phone|mob)\b', text, re.IGNORECASE):
            # Exception: unless line specifically contains currency symbol and small text length
            if not re.search(r'[₹$]', text):
                continue

        # Ignore 10+ digit pure numbers (phone numbers, account numbers, txn IDs)
        pure_digits = re.sub(r'\D', '', text)
        if len(pure_digits) >= 10:
            continue

        # Target text to scan: 15 items before + current item + next 50 adjacent items (handles multi-word OCR line breaks & preceding total numbers)
        scan_texts = [text]
        if is_explicit_total or is_standalone_total:
            scan_texts = []
            for j in range(max(0, i - 15), min(len(items), i + 50)):
                item_t = items[j].get("text", "").strip()
                norm_t = re.sub(r'^[zZTtaA€£eExXsSkK@$#*?][\.:\-\=\s]*([0-9]+(?:\.[0-9]{1,2})?)', r'₹\1', item_t)
                scan_texts.append(norm_t)

        combined_text = " ".join(scan_texts)

        # Regex patterns for amounts: ₹40, ₹ 40, Rs. 40, Rs 40, INR 40, 40.00
        patterns = [
            r'(?:₹|Rs\.?|INR|[zZTtaA€£eExXsSkK@$#*?])\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)',
            r'(?:^|[^0-9\.])([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})(?=[^0-9\.]|$)',
            r'(?:total|amount|paid)\s*(?:is|:)?\s*(?:₹|Rs\.?|INR|[zZTtaA€£eExXsSkK@$#*?])?\s*([0-9]+(?:\.[0-9]{1,2})?)'
        ]

        for p_idx, pattern in enumerate(patterns):
            for match in re.finditer(pattern, combined_text, re.IGNORECASE):
                raw_num = match.group(1).replace(',', '')
                try:
                    val = float(raw_num)
                    # For generic amount keyword matching (pattern 3 without explicit total keyword), require val >= 10.0
                    if p_idx == 2 and not (is_explicit_total or is_standalone_total) and val < 10.0:
                        continue

                    # Exclude amounts outside realistic transaction bounds
                    if 1.0 <= val <= 500000.0:
                        box_y = box.get('y', 0)
                        height_boost = 1.2 if 100 <= box_y <= 800 else 1.0
                        currency_boost = 1.3 if re.search(r'[₹$]', combined_text) else 1.0
                        
                        # Apply keyword score multiplier
                        keyword_boost = 1.0
                        if is_explicit_total:
                            keyword_boost = 100.0
                        elif is_standalone_total:
                            keyword_boost = 10.0
                        elif is_subtotal:
                            keyword_boost = 2.0

                        score = conf * height_boost * currency_boost * keyword_boost
                        candidates.append((val, score))
                except ValueError:
                    continue

    if not candidates:
        return None

    # Sort candidates by score descending
    candidates.sort(key=lambda x: x[1], reverse=True)
    return candidates[0][0]

def extract_merchant(items: List[Dict[str, Any]]) -> Optional[str]:
    """
    Hybrid spatial & contextual merchant name extractor.
    Uses movie title patterns, anchor keywords ("To", "Paid to", "Merchant", etc.) and bounding box proximity.
    """
    # Pattern 0: Movie / Cinema ticket title (e.g., "Movie : Kalki 2898 AD (2D)" or "Movie" on line 1 and "Kalki 2898 AD" on line 2)
    for i, item in enumerate(items):
        text = item.get("text", "").strip()
        text_lower = text.lower()

        if "movie" in text_lower:
            # Inline "Movie : Title" match
            movie_match = re.search(r'movie\s*:\s*(.+)', text, re.IGNORECASE)
            if movie_match:
                clean_m = clean_movie_title(movie_match.group(1))
                if clean_m and not re.search(r'^(?:date|time|audi|seat|ticket|qty|amount)', clean_m, re.IGNORECASE):
                    return clean_m
            
            # Next line match if item is just "Movie" or "Movie :"
            if re.match(r'^movie\s*:?$', text, re.IGNORECASE):
                for j in range(i + 1, min(i + 12, len(items))):
                    next_text = items[j].get("text", "").strip()
                    if next_text and not re.search(r'(?:date|time|audi|seat|ticket|qty|amount|sub\s*total|total|adult)', next_text, re.IGNORECASE):
                        clean_m = clean_movie_title(next_text)
                        if clean_m:
                            return clean_m

    for i, item in enumerate(items):
        text = item.get("text", "").strip()
        box = item.get("box", {})
        text_lower = text.lower()

        for kw in MERCHANT_KEYWORDS:
            if text_lower.startswith(kw):
                # Scenario 1: Same line contains merchant name, e.g. "To DONGARA VINILA"
                remainder = text[len(kw):].strip(" :-\t")
                remainder_clean = clean_merchant_name(remainder)
                if remainder_clean and len(remainder_clean) >= 3:
                    return remainder_clean

                # Scenario 2: Merchant name is on adjacent lines below (skipping 2-letter avatar initials like BA)
                for j in range(i + 1, min(i + 6, len(items))):
                    next_item = items[j]
                    next_text = next_item.get("text", "").strip()
                    clean_next = clean_merchant_name(next_text)
                    if clean_next and len(clean_next) >= 3 and not (len(clean_next) <= 2 and clean_next.isupper()):
                        return clean_next

    # Pattern 2: Retail / Store Brand Header Combiner (e.g. "More MEGA STORE", "More Retail", "DMart", "Smart Bazaar")
    store_kw = re.compile(r'\b(?:mega\s*store|retail|supermarket|hypermarket|mart|bazaar|provision|store|groceries|super\s*market)\b', re.IGNORECASE)
    for i, item in enumerate(items[:20]):
        text = item.get("text", "").strip()
        if store_kw.search(text):
            clean = clean_merchant_name(text)
            if clean and len(clean) >= 3:
                if re.match(r'^(?:mega\s*store|retail|store|mart|supermarket)$', clean, re.IGNORECASE):
                    for j in range(max(0, i - 4), min(len(items), i + 4)):
                        if j == i:
                            continue
                        adj_text = items[j].get("text", "").strip()
                        adj_clean = clean_merchant_name(adj_text)
                        if adj_clean and len(adj_clean) >= 3 and not store_kw.search(adj_clean):
                            return f"{adj_clean} {clean}" if j < i else f"{clean} {adj_clean}"
                return clean

    # Fallback heuristic: First clean non-numeric title line in top 35% of image
    for item in items[:12]:
        text = item.get("text", "").strip()
        box = item.get("box", {})
        if box.get("y", 0) < 500:
            clean = clean_merchant_name(text)
            if clean and len(clean) >= 3 and not re.search(r'\d', clean):
                return clean

    return None

def clean_movie_title(raw_title: str) -> Optional[str]:
    if not raw_title:
        return None
    # Strip (2D), (3D), 2D, 3D, non-alphanumeric symbols
    cleaned = re.sub(r'\(\s*\d[daD]\s*\)', '', raw_title, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b\d[daD]\b', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', cleaned).strip()
    cleaned = re.sub(r'\s+', ' ', cleaned)
    if len(cleaned) >= 2 and re.search(r'[a-zA-Z]', cleaned):
        return cleaned
    return None

def clean_merchant_name(name: str) -> Optional[str]:
    """
    Strips noise, UPI IDs (@okaxis, @ybl), phone numbers, item units, address terms, and common status words.
    """
    if not name:
        return None

    # Strip UPI handle suffix
    name = re.sub(r'@[a-zA-Z0-9]+', '', name).strip()
    # Strip leading/trailing non-alphanumeric noise
    name = re.sub(r'^[^\w]+|[^\w]+$', '', name).strip()

    name_lower = name.lower()
    if any(ign in name_lower for ign in IGNORE_MERCHANT_TEXT):
        return None

    # Skip item lines with unit quantities (e.g. Rice 5kg, Sugar 1kg, Tea 250gm, Sunflower 1L, Salt 1kg)
    if re.search(r'\d+\s*(?:kg|g|gm|l|ml|pc|pcs|pack|pkt|ltr)\b', name, re.IGNORECASE):
        return None

    # Skip location & address lines (e.g. Koramangala Bangalore 560034, 80 Feet Road, Ph: 080-25559876)
    if re.search(r'\b(?:bangalore|bengaluru|koramangala|indiranagar|jayanagar|whitefield|hsr|mumbai|delhi|chennai|hyderabad|pune)\b', name, re.IGNORECASE):
        return None
    if re.search(r'\b(?:\d{6}|5600\d{2})\b', name):
        return None
    if re.search(r'\b(?:road|street|nagar|layout|colony|marg|cross|main|floor|suite|plot|sector|phase|pincode|pin|gstin|fssai)\b', name, re.IGNORECASE):
        return None
    if re.search(r'^\s*(?:no\.|ph:|phone:|tel:)', name, re.IGNORECASE):
        return None

    # Filter out 1-2 letter uppercase avatar icon initials (e.g. BA, CR, VK, AK)
    if len(name) <= 2 and name.isupper():
        return None

    # Must contain at least 3 characters and at least one letter
    if len(name) >= 3 and re.search(r'[a-zA-Z]', name):
        return name

    return None
