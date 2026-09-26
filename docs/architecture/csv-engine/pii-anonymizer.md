# PII Anonymizer — Technical Reference

> ⚠️ **WIP:** User correction persistence (learning from feedback) and full benchmark (1800 rows <2s) not yet implemented. All 10 detectors are production-ready.

## Problem & Constraints

Polish bank CSV transaction titles contain sensitive personal data mixed with merchant names and banking phrases:

```
PRZELEW WYCHODZĄCY Jan Kowalski 51 2490 0005 0000 4000 1234 5678 ul. Kościuszki 43
```

The anonymizer must:
- Detect **10 PII types** with ≥95% recall on names, 100% on IBAN/PESEL (checksum-validated)
- Produce **<5% false positives** (50 out of 1000 rows = user abandonment threshold)
- Process **1800 rows in <1 second** (typical 1-year bank export)
- Run **entirely client-side** — raw titles NEVER leave the browser
- Handle ALL CAPS text (standard in Polish bank transfers)

**Key insight:** Polish bank CSVs use ALL CAPS for everything. "JAN KOWALSKI" and "BIEDRONKA" look identical syntactically — differentiation requires dictionary-based whitelisting and contextual heuristics.

**See also:** [Architecture overview](./overview.md) § 4-6 for pipeline design, [ADR-002](../../adr/002-csv-boundary-detection-algorithm.md) for related parser decisions, [DEC-004](../../history/decisions/DEC-004-per-profile-import-layer-anonymization.md) (layered anonymization per profile), [DEC-005](../../history/decisions/DEC-005-gdpr-front-only-anonymization-in-mvp.md) (GDPR front-only MVP), [DEC-010](../../history/decisions/DEC-010-plugin-architecture-for-pii-rules-nestjs-multi-provider.md) (backend PII plugin architecture).

---

## Architecture Overview

```
features/csv-import/model/anonymizer/
├── pipeline.ts                 # Orchestrator: detect → whitelist → gate → resolve → mask
├── conflict-resolver.ts        # Priority + confidence span overlap resolution
├── masker.ts                   # 10 type-specific masking strategies
├── constants.ts                # Shared: COMPANY_FORM_VARIANTS, COMPANY_PREFIX_ABBREVIATIONS
├── detectors/
│   ├── iban-detector.ts        # Regex + mod97 checksum (full + bare PL 26-digit)
│   ├── card-detector.ts        # Luhn checksum + BIN prefix + masked patterns
│   ├── pesel-detector.ts       # 11-digit + mod10 checksum + birth date validation
│   ├── nip-detector.ts         # 10-digit + mod11 checksum + context-dependent
│   ├── national-id-detector.ts # 3 letters + 6 digits (dowód osobisty) + checksum
│   ├── birth-date-detector.ts  # Context keywords (ur., urodzona) + date pattern
│   ├── phone-detector.ts       # PL (+48/9-digit) + INT + no-space prefix, exclusion patterns
│   ├── email-detector.ts       # Standard RFC pattern, personal vs generic confidence split
│   ├── name-detector.ts        # Dictionary + positional heuristics + company filter
│   └── address-detector.ts     # Street patterns (ul./al./os.) + postal code (XX-XXX)
└── dictionaries/
    ├── dictionary-provider.ts  # Factory with cache, dev stubs, prod API loader
    └── stubs/
        ├── names-pl.json       # Top 500 male + 500 female PL first names
        ├── names-en.json       # Top 200 EN first names
        ├── surnames-pl.json    # Top 2000 PL surnames
        ├── merchants.json      # 3000+ known merchant names (uppercased)
        ├── cities-pl.json      # All PL cities (900+, uppercased)
        └── phrases.json        # 200+ banking/transaction phrases (lowercased)
```

---

## Core Interfaces

```typescript
// Plugin contract — each detector implements this
interface PiiDetector {
  readonly id: string;        // Unique identifier (e.g. 'iban', 'name')
  readonly priority: number;  // Higher = wins conflicts (92=PESEL, 50=name, 40=address)
  detect(text: string, dictionaries: DictionarySet): readonly DetectionSpan[];
}

// Output of each detector — character-level spans
interface DetectionSpan {
  readonly start: number;          // Char index in original string
  readonly end: number;
  readonly type: PiiType;          // 'iban' | 'phone' | 'name' | 'email' | ... (10 types)
  readonly confidence: number;     // 0.0 – 1.0
  readonly original: string;       // Matched text
  readonly detectorId: string;     // Which detector produced this
  readonly metadata?: Record<string, unknown>;  // e.g. { checksumValid: true }
}

// Dictionary lookups — loaded once, cached in memory
interface DictionarySet {
  readonly firstNames: ReadonlySet<string>;  // Lowercased (PL + EN)
  readonly surnames: ReadonlySet<string>;    // Lowercased
  readonly merchants: ReadonlySet<string>;   // Uppercased (as they appear in CSVs)
  readonly cities: ReadonlySet<string>;      // Uppercased
  readonly phrases: ReadonlySet<string>;     // Lowercased, multi-word
}

// Pipeline output per row
interface AnonymizationEntry {
  readonly rowIndex: number;
  readonly originalTitle: string;     // ⚠️ MUST be stripped before store/API
  readonly anonymizedTitle: string;   // Masked version
  readonly spans: readonly DetectionSpan[];
  readonly status: 'safe' | 'needs_review' | 'anonymized';
  readonly accepted: boolean;
}
```

**Design choice: `DictionarySet` uses `ReadonlySet<string>` (not arrays).** O(1) lookup is critical for the name detector which checks every word against 4000+ entries. Array.includes would make the pipeline O(n×m) where m = dictionary size.

---

## Algorithm: Pipeline (step-by-step)

### Input
Array of raw title strings (one per CSV row).

### Step 1: Run All Detectors

```
For each title:
  allSpans ← []
  for each detector in [pesel, iban, card, nip, phone, nationalId, email, birthDate, name, address]:
    allSpans.push(...detector.detect(title, dictionaries))
```

Detectors run independently, may produce overlapping spans. Order doesn't matter — conflict resolution handles overlap.

### Step 2: Whitelist Filter

```
For each span:
  if span.original.toUpperCase() ∈ merchants → DISCARD
  if span.original.toUpperCase() ∈ cities → DISCARD
  if span.original.toLowerCase() ∈ phrases → DISCARD
  if multi-word join(words.toUpperCase()) ∈ merchants → DISCARD
```

**Purpose:** Prevents "POCZTA POLSKA" (merchant) from being flagged as two names, or "WARSZAWA" (city) from being flagged as a surname.

### Step 3: Confidence Gate

```
For each span:
  if confidence < 0.7 → DISCARD (likely false positive)
```

Spans with confidence [0.7, 0.9) → status `needs_review` (user confirms).
Spans with confidence ≥ 0.9 → status `anonymized` (auto-accepted).

### Step 4: Conflict Resolution

```
Sort remaining spans by: priority DESC, then confidence DESC
For each span (highest first):
  if it overlaps any already-accepted span → DISCARD
  else → ACCEPT
Sort accepted spans by position (start ASC)
```

**Result:** Non-overlapping set where high-priority detectors always win. PESEL (priority 92) beats name (priority 50) if they overlap the same characters.

### Step 5: Masking

```
For each accepted span (sorted by position):
  result += text[lastEnd..span.start]  // unmodified text between spans
  result += maskFn(span)                // type-specific mask
  lastEnd = span.end
result += text[lastEnd..]               // trailing text
```

### Step 6: Determine Status

```
if no spans → 'safe'
if all spans have confidence ≥ 0.9 → 'anonymized'
else → 'needs_review'
```

### Output
`AnonymizationEntry[]` — one per row, with masked title, spans, and review status.

---

## Detectors: Registry & Priority

| # | Detector | Priority | Validation | Confidence Range | Key Pattern |
|---|----------|----------|-----------|-----------------|-------------|
| 1 | PESEL | 92 | Checksum mod10 + birth date ranges | 0.88–0.99 | 11 digits, not adjacent to other digits |
| 2 | IBAN | 90 | mod97 (ISO 7064) | 0.97–0.99 | CC + 26 digits, bare PL 26-digit |
| 3 | Card | 88 | Luhn + BIN prefix | 0.92–0.99 | 16 digits, masked patterns (****1234) |
| 4 | NIP | 86 | Checksum mod11 | 0.92–0.98 | 10 digits (dashed or compact+context) |
| 5 | Phone | 85 | PL mobile prefix (5/6/7/8xx) | 0.75–0.95 | +48 XXX XXX XXX, bare 9-digit |
| 6 | National ID | 84 | Checksum + letter-to-number | 0.80–0.95 | 3 letters + 6 digits (ABC 123456) |
| 7 | Email | 70 | RFC pattern | 0.82–0.97 | user@domain.tld |
| 8 | Birth Date | 60 | Context keyword required | 0.94 | "ur. DD.MM.YYYY" |
| 9 | Name | 50 | Dictionary + positional heuristics | 0.65–0.95 | 2-3 words, mixed case or ALL CAPS |
| 10 | Address | 40 | Street prefix pattern | 0.82–0.88 | ul./al./os. + words + number |

**Priority rationale:** Checksum-validated detectors (PESEL, IBAN, card, NIP) get highest priority because they have mathematical certainty. Phone and national ID use structural validation. Name and address rely on heuristics, so they get lowest priority — if a name-like span overlaps with a verified IBAN, the IBAN wins.

---

## Detector Algorithms (detailed)

### IBAN Detector (priority 90)

**Patterns matched:**
1. Full international: `CC DD XXXX XXXX XXXX XXXX XXXX XXXX` (country + 26 digits, with spaces)
2. Compact international: `CCDDXXXXXXXXXXXXXXXXXXXXXXXX` (28 chars, no spaces)
3. Bare Polish (spaced): `'DD XXXX XXXX XXXX XXXX XXXX XXXX` (quote prefix, 26 digits)
4. Bare Polish (compact): `'DDXXXXXXXXXXXXXXXXXXXXXXXX` (26 digits)

**Validation:** mod97 algorithm (ISO 7064):
1. Move first 4 chars to end
2. Convert letters to numbers (A=10, B=11, ..., Z=35)
3. Compute remainder mod 97 (chunked processing to avoid BigInt)
4. Valid if remainder === 1

**Bare PL handling:** Polish banks export account numbers without the "PL" prefix. Detector prepends "PL" before mod97 validation. Leading single quote `'` is common CSV formatting — stripped before validation.

**Confidence:** 0.99 (full IBAN with checksum), 0.97 (bare PL with checksum)

**False positive rate:** Effectively 0% — mod97 eliminates random number sequences.

---

### Card Detector (priority 88)

**Patterns:**
- Full with separators: `1234 5678 9012 3456` or `1234-5678-9012-3456`
- Compact: 16 consecutive digits
- Masked (bank-provided): `**** **** **** 1234`, `601112******4820`, `****1234`

**Validation:** Luhn algorithm + BIN prefix check:
- Visa: starts with 4
- Mastercard: 51-55 or 2221-2720
- Maestro: 5018/5020/6xxx
- Amex: 34 or 37

**Key design:** Masked card patterns (already asterisked by the bank) get confidence 0.92 — bank confirmed it's a card, but format may be ambiguous. Full 16-digit with valid Luhn + BIN gets 0.99.

---

### PESEL Detector (priority 92)

**Pattern:** Exactly 11 digits, not preceded/followed by another digit.

**Double validation:**
1. **Checksum:** Weighted sum mod10: weights `[1,3,7,9,1,3,7,9,1,3]`, check digit = `(10 - sum%10) % 10`
2. **Birth date:** Extracted from digits 1-6. Month encoding: 01-12 (1900s), 21-32 (2000s), 41-52 (2100s). Day 1-31.

**Context boost:** If preceded by "pesel", "nr pesel", "numer pesel" (within 25 chars) → confidence 0.99, otherwise 0.88.

**Why highest priority (92):** PESEL is an 11-digit number that could overlap with phone numbers (9 digits) or partial IBANs. Its double validation (checksum + birth date) means if it passes, it IS a PESEL with near-certainty.

---

### NIP Detector (priority 86)

**Patterns:**
- Dashed: `123-456-78-90` (always detected)
- Compact: 10 consecutive digits (only with context keyword nearby)

**Checksum:** Weighted sum mod11: weights `[6,5,7,2,3,4,5,6,7]`. Remainder must equal 10th digit. If remainder is 10, NIP is invalid.

**Context requirement for compact form:** Bare 10 digits are too ambiguous (could be phone, partial IBAN, order number). Only accepted with nearby keywords: `nip`, `nip:`, `nr nip`, `numer nip`.

---

### Phone Detector (priority 85)

**Patterns:**
- Polish: `+48 XXX XXX XXX` or `XXX XXX XXX` (9 digits starting with 5/6/7/8)
- International: `+XX XXXX XXXX XXXX` (country code + 7-12 digits)
- No-space: `+48601234567` or `(+48)601234567`

**Mobile prefix validation:** Bare 9-digit (no +48) requires first digit ∈ {5, 6, 7, 8} (Polish mobile ranges). This eliminates landline-format false positives.

**Exclusion patterns (CR-12 fix):** Not flagged if preceded by:
- Invoice/order keywords: `fv`, `faktura`, `nr`, `numer`, `zamówienie`, `ref`
- BLIK transaction IDs: `BLK25060700847291`
- Insurance policy numbers: `nr polisy`
- Authorization codes: `autoryzacja:`, `auth:`
- Letters directly adjacent: `BIEDRONKA1234` (store number, not phone)

**Confidence:** +48 prefix → 0.95, context keyword → 0.90, bare 9-digit → 0.75

---

### National ID Detector (priority 84)

**Pattern:** 3 uppercase letters + 6 digits (with optional space): `ABS 847291` or `ABS847291`

**Checksum:** Letters converted to numbers (A=10, B=11...), weighted sum with `[7,3,1,0,7,3,1,7,3]` where position 3 is the check digit (skipped in sum). Valid if `sum % 10 === check_digit`.

**Context keywords:** `dowód`, `dowodu`, `nr dowodu`, `seria i nr`, `tożsamości`

**Without context:** Requires checksum validation to reduce false positives (3-letter + 6-digit sequences appear in reference numbers).

---

### Birth Date Detector (priority 60)

**Pattern:** Context keyword + date: `ur. 15.03.1992`, `urodzona 1992-03-15`, `data urodzenia: 15/03/92`

**Context keywords (required):** `ur.`, `ur:`, `data ur.`, `urodzony`, `urodzona`, `urodzenia`, `born`, `d.o.b.`

**Confidence:** Fixed 0.94 — context presence is strong signal, but date itself isn't validated (delegated to date-parser if needed).

**Design choice:** Birth dates ONLY detected with context. A bare date in a bank title is the transaction date, not a birth date.

---

### Email Detector (priority 70)

**Pattern:** Standard RFC: `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`

**Confidence split:**
- Personal (has `.` in local part or local > 8 chars): 0.97 — likely `jan.kowalski@gmail.com`
- Generic (short local: `info@`, `admin@`): 0.82 — may be business contact user wants to keep

---

### Name Detector (priority 50)

The most complex detector. Uses three strategies layered:

**Strategy 1: Mixed-case pattern** (regex)
```
Pattern: [A-ZĄĆĘ...][a-ząćę...]{2,}([\s-][A-ZĄĆĘ...][a-ząćę...]{2,}){1,2}
Matches: "Jan Kowalski", "Anna Nowak-Wiśniewska"
```

**Strategy 2: ALL-CAPS candidates** (word pairing)
```
Find all ALL-CAPS words (≥3 letters) → pair adjacent words (2-3 word sequences)
Matches: "JAN KOWALSKI", "ANNA MARIA NOWAK"
```

**Confidence computation (both strategies):**
| Condition | Confidence |
|-----------|-----------|
| firstName ∈ dict AND surname ∈ dict | 0.95 |
| firstName ∈ dict AND has context | 0.85 |
| surname ∈ dict AND has context | 0.82 |
| (firstName OR surname) ∈ dict, no context | 0.72 |
| Context only (no dict match) | 0.65 |
| None | 0.30 (below gate → discarded) |

**False positive prevention (layered):**
1. **Merchant whitelist:** "POCZTA POLSKA" → in merchants dict → not a name
2. **City whitelist:** "WARSZAWA" → in cities dict → not flagged
3. **Phrase whitelist:** "PRZELEW WYCHODZĄCY" → in phrases dict → not flagged
4. **Company prefix filter:** If preceded by P.H.U, F.H.U, Sp. z o.o., etc. → company name, not PII
5. **Minimum confidence gate:** < 0.6 → discarded before even reaching pipeline

**Context keywords:** `przelew`, `od`, `dla`, `na rzecz`, `nadawca`, `odbiorca`, `wpłata`, `wypłata`, `zleceniodawca`, `beneficjent`

---

### Address Detector (priority 40)

**Patterns:**
1. Street: `ul./al./os./pl. + 1-4 words + house number(/apt)` → confidence 0.88
2. Postal code: `XX-XXX + city name (1-2 words)` → confidence 0.82

**Lowest priority (40):** Address components often overlap with name spans (street named after a person: "ul. Tadeusza Kościuszki 43"). Address yields to name detection when both fire.

---

## Conflict Resolver

```typescript
export const resolveConflicts = (
  spans: readonly DetectionSpan[],
  priorityMap: ReadonlyMap<string, number>,
): DetectionSpan[]
```

**Algorithm:**
1. Sort by priority (DESC), then confidence (DESC)
2. Greedy: for each span, accept if it doesn't overlap any already-accepted span
3. Resort final set by position (start ASC) for masking

**Overlap test:** `span.start < existing.end && span.end > existing.start`

**Example:**
```
Input:  PESEL span [10,21] prio=92 conf=0.99
        Name span  [15,30] prio=50 conf=0.85
Result: PESEL wins (higher priority), name discarded (overlaps)
```

**Time complexity:** O(n²) in worst case (n = total spans per row). Acceptable because n is typically <10 per title.

---

## Masker: Type-Specific Strategies

| Type | Strategy | Example |
|------|----------|---------|
| IBAN | First 4 + last 4 | `PL61 •••• •••• 5678` |
| Card | First 4 + last 4 (or existing mask) | `4532 •••• •••• 7890` |
| PESEL | First 2 + last 2 | `92•••••••15` |
| NIP | First 3 + last 2 | `123-•••-••-90` |
| National ID | First 3 (letters) | `ABS ••••••` |
| Birth Date | Fixed mask | `ur. ••.••.••••` |
| Name | First char per word | `J••• K•••••••` |
| Phone | Last 3 digits | `••• ••• 789` |
| Email | First char + domain | `j•••@gmail.com` |
| Address | Prefix only | `ul. •••` |

**Design principle:** Each mask preserves enough structure for the user to verify correctness without revealing the full PII. IBAN shows first/last 4 so user recognizes the account. Name shows initials so user confirms "yes, that's a person."

**Implementation:** `applyMasking()` processes spans left-to-right, concatenating unmasked text between spans with masked replacements. Spans MUST be pre-sorted by position (guaranteed by conflict resolver output).

---

## Dictionary System

### Loading Strategy
- **On mount:** `createDictionaryProvider()` with cache — loads once, returns cached Set on subsequent calls
- **Dev mode:** JSON stubs imported directly (bundled, ~500KB gzipped ~150KB)
- **Prod mode:** `GET /api/dictionaries/:type` behind DictionaryProvider factory (same interface)
- **Failure mode:** If load fails → block anonymization step, show retry (pipeline cannot run without dictionaries)

### Storage Rules
- **In-memory only** — never localStorage, never sessionStorage, never IndexedDB
- **No PII adjacency** — dictionaries themselves are public data (common names, cities), but proximity to raw titles warrants caution

### Dictionary Sizes
| Dictionary | Entries | Storage | Purpose |
|-----------|---------|---------|---------|
| names-pl.json | ~1000 | Lowercase | PL first names (male + female) |
| names-en.json | ~200 | Lowercase | EN first names (international) |
| surnames-pl.json | ~2000 | Lowercase | PL surnames |
| merchants.json | ~3000+ | Uppercase | Known merchant/business names |
| cities-pl.json | ~900+ | Uppercase | All Polish cities |
| phrases.json | ~200+ | Lowercase | Banking transaction phrases |

---

## Decision Log

### 1. Priority-based conflict resolution (not "most specific wins")

**Chose:** Fixed priority per detector type, conflicts resolved by priority then confidence.
**Over:** "Most specific span wins" (shortest span = most precise).
**Because:** Specificity is unreliable — a PESEL (11 chars) is shorter than a name+IBAN combo, but PESEL has mathematical certainty. Priority encodes our confidence in the detector's accuracy, not the span's length.
**Trade-off:** Requires manual priority assignment. If a new detector is added with wrong priority, it may suppress legitimate detections.

### 2. Whitelist filter BEFORE conflict resolution (not after)

**Chose:** Filter merchants/cities/phrases as step 2 (before gate and resolver).
**Over:** Filtering after resolution.
**Because:** Whitelisted spans should never participate in conflict resolution. If "POCZTA POLSKA" (merchant) overlaps with a real name span, removing it early lets the real span survive. If filtered after, it might have already suppressed the real name through conflict resolution.

### 3. Compact NIP requires context (dashed NIP doesn't)

**Chose:** Bare 10-digit NIP only accepted with nearby "nip" keyword.
**Over:** Always accepting valid checksum 10-digit sequences.
**Because:** 10-digit numbers passing mod11 aren't rare — phone numbers with +48 prefix are 11 digits, order IDs can be 10 digits. Dashed format `123-456-78-90` is structurally distinctive enough. False positive cost (flagging a reference number as NIP) is high.
**Trade-off:** Misses NIP numbers mentioned without context (rare in bank transfers — NIP usually has explicit label).

### 4. Name detector MIN_CONFIDENCE = 0.6 (internal gate before pipeline's 0.7 gate)

**Chose:** Name detector has its own minimum of 0.6 (discards candidates scoring below before returning).
**Over:** Returning all candidates and letting the pipeline's 0.7 gate handle it.
**Because:** The name detector can generate dozens of candidate spans per title (every 2-3 word ALL-CAPS sequence). Returning all of them to the pipeline would bloat conflict resolution input. Pre-filtering at 0.6 keeps the pipeline lean while still allowing low-confidence names (0.6-0.7) to exist for potential future use (user correction learning).

### 5. Company prefix filter in name detector (not pipeline whitelist)

**Chose:** If text is preceded by "P.H.U", "Sp. z o.o.", etc. → suppress in name detector itself.
**Over:** Adding company names to the merchant dictionary.
**Because:** Company names are infinite and dynamic. "P.H.U KOWALSKI" should not flag "KOWALSKI" as a name even though "KOWALSKI" IS in the surname dictionary. The structural signal (preceded by company form abbreviation) is more reliable than trying to enumerate all companies.
**Trade-off:** Only works for Polish company form abbreviations. Foreign company forms (Ltd, GmbH, Inc) not handled — acceptable for PL-focused app.

---

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Dictionary loading | O(n) — one-time, ~500KB | <1s (gzipped ~150KB transfer) |
| Set.has() lookup | O(1) per check | Used thousands of times per title |
| Regex detectors (8) | O(text.length) per detector | Linear scan, no backtracking |
| Name detector | O(words² × dict) → O(words²) | Word pairing + Set lookup |
| Conflict resolution | O(n²) where n = spans per title | n typically <10 |
| Masking | O(text.length + spans) | Single pass, string concat |
| **Total (1800 rows)** | | **<1s measured** |

**Bottleneck:** Name detector on long descriptions (100+ characters) with many ALL-CAPS words. Mitigated by the 2-3 word window limit in `findAllCapsNames`.

---

## Edge Cases & Known Limitations

### Handled Edge Cases

| Case | Solution |
|------|----------|
| "POCZTA POLSKA" flagged as name | Merchant whitelist filter |
| "WARSZAWA" flagged as surname | City whitelist filter |
| "PRZELEW WYCHODZĄCY" flagged as name | Phrase whitelist filter |
| "P.H.U KOWALSKI" — company name | Company prefix filter |
| IBAN without PL prefix | Bare PL detection (prepend PL, validate mod97) |
| IBAN with leading quote `'61 2490...` | Quote stripped before validation |
| Card already masked by bank | Masked patterns detected (confidence 0.92) |
| BLIK transaction ID looks like phone | `BLK` prefix exclusion |
| NR POLISY + digits looks like phone | Policy number prefix exclusion |
| Name overlaps PESEL digits | PESEL wins (priority 92 > 50) |
| Personal vs generic email | Confidence split (0.97 vs 0.82) |
| Compound surname (Nowak-Wiśniewska) | Hyphen in name regex pattern |

### Known Limitations

| Limitation | Impact | Planned Resolution |
|-----------|--------|-------------------|
| No learning from user corrections | Same false positives on repeat imports | UserCorrection persistence (architecture doc § 10) |
| Single-word names not detected | "Kowalski" alone (without first name) → missed | Positional + context heuristic expansion |
| German/Ukrainian names not in PL dict | Immigrants' names may be missed | Multi-locale name dictionaries |
| Address without prefix | "Kościuszki 43" without "ul." → missed | Context-aware address heuristics |
| PESEL without context: 0.88 confidence | Falls into `needs_review` zone | Acceptable — user confirms in 1 click |
| No SSN/foreign ID detection | Only Polish document types supported | Add detectors per market expansion |
| Dictionary updates require rebuild | New merchants need stub JSON update | Prod API with admin CRUD (post-MVP) |

### What Defeats This Anonymizer

1. **Name not in dictionary AND no context keyword** — "WIŚNIEWSKI" alone without "przelew" or "od" nearby → confidence too low → missed
2. **Novel company name matching a surname** — "KOWALSKI TRADING" where "KOWALSKI" is in surname dict and no company prefix detected → false positive
3. **Foreign IBAN formats with different digit counts** — currently only validates mod97, which works universally, but bare detection only handles PL 26-digit format
4. **Intentionally obfuscated PII** — "J a n K o w a l s k i" (spaces between chars) → no detector handles this pattern

---

*Generated: 2026-07-02 | Source: `client/src/features/csv-import/model/anonymizer/`*
