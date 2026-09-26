# CSV Parser & Anonymizer Engine — Architecture

## Status: APPROVED (DEC-061, 2026-06-29)

> **Recovered source:** The originally imported log ended at DEC-058, but [DEC-061](../../history/decisions/DEC-061-csv-parser-anonymizer-enterprise-grade-rewrite.md) was recovered on 2026-08-01 and corroborates this approved architecture. See the [recovery integrity record](../../history/decisions/integrity-issues.md#recovered-dec-059-dec-060-and-dec-061) for provenance.

---

## 1. Problem Statement

Average Polish user imports 1 year of bank CSV (1000–1800 rows). The engine must:
- Parse CSV from any Polish bank (encoding, separators, date/amount formats vary)
- Detect and mask PII in transaction titles with **≥95% accuracy**
- Produce <5% false positives (users won't fix more than ~50 rows out of 1000)
- Run entirely client-side — raw data NEVER leaves the browser

If accuracy drops below 95%, users abandon the feature.

---

## 2. Module Structure

```
features/csv-import/model/
├── types.ts                          # Domain types (ParsedCsvData, TransactionRow, etc.)
│
├── parser/
│   ├── types.ts                      # ParserConfig, ParseResult, ParserError
│   ├── csv-parser.ts                 # Orchestrator: detect encoding → detect separator → parse → validate
│   ├── encoding-detector.ts          # jschardet wrapper: detect Windows-1250, UTF-8, ISO-8859-2
│   ├── separator-detector.ts         # Sample first 5 lines, count ; vs , vs \t occurrences
│   ├── date-parser.ts               # Multi-format: DD.MM.YYYY, YYYY-MM-DD, DD/MM/YYYY, auto-detect from sample
│   └── amount-parser.ts             # Multi-locale: "1 234,56" (PL) vs "1,234.56" (EN) vs "-87.43"
│
├── column-mapper/
│   ├── types.ts                      # BankProfile, ColumnMapping, DomainField
│   ├── column-mapper.ts              # Applies confirmed mapping → TransactionRow[]
│   ├── auto-detector.ts             # Sample-based column type inference (date/number/text patterns)
│   └── bank-profiles/
│       ├── types.ts                  # BankProfile interface
│       ├── mbank.ts                  # header signatures + defaults
│       ├── pko.ts
│       ├── ing.ts
│       ├── santander.ts
│       ├── millennium.ts
│       ├── revolut.ts
│       ├── generic.ts               # Fallback — user-assisted
│       └── registry.ts              # detectBank(headers): BankProfile | null
│
├── anonymizer/
│   ├── types.ts                      # PiiDetector, DetectionSpan, Confidence, MaskingStrategy
│   ├── pipeline.ts                   # Orchestrator: detect all → filter by whitelists → resolve conflicts → mask
│   ├── conflict-resolver.ts          # Span overlap resolution with priority system
│   ├── masker.ts                     # Type-specific masking strategies
│   ├── detectors/
│   │   ├── types.ts                  # PiiDetector interface
│   │   ├── iban-detector.ts          # Regex + mod97 checksum validation
│   │   ├── phone-detector.ts         # PL (+48/9-digit) + INT, context-aware
│   │   ├── name-detector.ts          # Dictionary-based + positional heuristics
│   │   ├── email-detector.ts         # Standard email pattern
│   │   └── address-detector.ts       # ul./al./os. + number patterns
│   └── dictionaries/
│       ├── types.ts                  # DictionaryProvider port, DictionarySet
│       ├── dictionary-provider.ts    # Loads from API (prod) or stubs (dev), caches as Set<string>
│       └── stubs/                    # Dev-mode JSON files
│           ├── names-pl.json         # Top 500 PL male + 500 female first names
│           ├── names-en.json         # Top 200 EN first names
│           ├── surnames-pl.json      # Top 2000 PL surnames
│           ├── merchants.json        # 3000+ known merchant names
│           ├── cities-pl.json        # All PL cities (900+)
│           └── phrases.json          # 200+ banking/transaction phrases (Przelew Wychodzący, etc.)
│
└── duplicate-detector.ts             # Hash-based (date+amount+title) — OK as-is
```

---

## 3. Core Interfaces

### PiiDetector (plugin contract)

```typescript
interface DetectionSpan {
  readonly start: number;          // char index in original string
  readonly end: number;
  readonly type: PiiType;          // 'name' | 'iban' | 'phone' | 'email' | 'address'
  readonly confidence: number;     // 0.0 – 1.0
  readonly original: string;       // matched text
  readonly metadata?: Record<string, unknown>; // detector-specific (e.g. iban checksum valid)
}

interface PiiDetector {
  readonly id: string;
  readonly priority: number;       // higher = runs first, wins conflicts
  detect(text: string, dictionaries: DictionarySet): readonly DetectionSpan[];
}
```

### DictionaryProvider (port — swappable backend/stubs)

```typescript
type DictionaryType = 'names_pl' | 'names_en' | 'surnames_pl' | 'merchants' | 'cities_pl' | 'phrases';

interface DictionarySet {
  readonly firstNames: ReadonlySet<string>;    // PL + EN combined, lowercased
  readonly surnames: ReadonlySet<string>;      // lowercased
  readonly merchants: ReadonlySet<string>;     // uppercased (as they appear in CSVs)
  readonly cities: ReadonlySet<string>;        // uppercased
  readonly phrases: ReadonlySet<string>;       // lowercased, multi-word
}

interface DictionaryProvider {
  loadAll(): Promise<DictionarySet>;
  isLoaded(): boolean;
}
```

### BankProfile

```typescript
interface BankProfile {
  readonly id: string;
  readonly bankName: string;
  readonly headerSignatures: readonly string[][];  // multiple possible header sets
  readonly defaultMapping: ColumnMapping;
  readonly dateFormat: string;                      // e.g. 'DD.MM.YYYY'
  readonly amountFormat: 'pl' | 'en';              // comma-decimal vs dot-decimal
  readonly encoding?: string;                      // expected encoding (hint)
  readonly separator?: string;                     // expected separator (hint)
  readonly skipRows?: number;                      // rows to skip before headers (mBank has 1)
}
```

---

## 4. Detection Pipeline (step-by-step)

For each row's title field:

```
1. INPUT: raw title string (e.g. "PRZELEW WYCHODZĄCY Jan Kowalski 51 2490 0005 0000 4000 1234 5678")

2. RUN ALL DETECTORS (parallel, span-based on raw string):
   - iban-detector  → span(27,55, type=iban, confidence=0.99)   [checksum valid]
   - name-detector  → span(21,34, type=name, confidence=0.92)   [Jan=dict, Kowalski=dict]
   - phone-detector → (no match)
   - email-detector → (no match)
   - address-detector → (no match)

3. WHITELIST FILTER:
   - For each span: check if span.original exists in merchants/cities/phrases dict
   - If yes → discard span (it's a known entity, not PII)
   - "PRZELEW WYCHODZĄCY" → in phrases dict → no detection created by name-detector
   
4. CONFLICT RESOLUTION (overlapping spans):
   - If spans overlap: highest priority detector wins
   - If same priority: highest confidence wins
   - Result: non-overlapping set of PII spans

5. CONFIDENCE GATE:
   - confidence ≥ 0.9 → status: 'anonymized' (auto-accepted)
   - 0.7 ≤ confidence < 0.9 → status: 'needs_review' (user confirms)
   - confidence < 0.7 → discarded (likely false positive)

6. MASKING (per type):
   - IBAN: "PL61 •••• •••• •••• •••• 5678" (show first 4 + last 4)
   - name: "J••• K•••••••" (first char + bullets)
   - phone: "••• ••• •89" (last 2-3 digits)
   - email: "j•••@•••.com" (first char + domain TLD)
   - address: "ul. ••• ••" (prefix only)

7. OUTPUT: AnonymizationEntry per row
```

---

## 5. Name Detection Strategy (critical for 95% accuracy)

### Step 1: Dictionary Match (high confidence)
```
For each word W in title:
  if lowercase(W) ∈ firstNames AND next word N where lowercase(N) ∈ surnames:
    → span(W+N, type=name, confidence=0.95)
```

### Step 2: Positional Heuristics (medium confidence)
```
After keywords [PRZELEW, WPŁATA, WYPŁATA, OD, DLA, NA RZECZ, NADAWCA, ODBIORCA]:
  next 2-3 capitalized words that are NOT in merchants/cities/phrases dict:
    → span(words, type=name, confidence=0.75)
```

### Step 3: Compound Surnames
```
Handle: Nowak-Wiśniewska, Kowalska-Nowak
Pattern: [name] [word-word] where both parts ∈ surnames → confidence=0.93
```

### False Positive Prevention
```
BEFORE creating any name span, check:
1. Is the entire sequence in merchants dict? (POCZTA POLSKA → not a name)
2. Is any word a known city? (WARSZAWA → not a surname)
3. Is the sequence part of a known phrase? (OBRÓT ENERGIA → not a name)
4. Is it ALL CAPS with no dict match? → likely merchant, not name (ALLEGRO → not a name)
   Exception: Polish names in ALL CAPS after PRZELEW keyword DO get detected
```

---

## 6. Dictionary System

### Loading Strategy
- **On wizard mount:** TanStack Query prefetches all dictionaries
- **Caching:** In-memory only (Set<string>), never localStorage (PII adjacent)
- **Failure mode:** If dictionaries fail to load → block anonymization step, show retry
- **Size budget:** ~500KB total (gzipped ~150KB) — acceptable for one-time load

### Dev Mode
- JSON files in `stubs/` directory, imported directly
- Same DictionaryProvider interface, different implementation

### Prod Mode
- `GET /api/dictionaries/:type` — returns string array
- Backend maintains and updates without frontend release
- ETag caching for repeat loads

### Dictionary Maintenance
Backend sources:
- Names: GUS (Polish statistics office) registry of given names
- Surnames: GUS surname frequency data
- Merchants: MCC code merchant lists + manual curation
- Cities: TERYT register (Polish territorial units)
- Phrases: Manually curated from bank documentation

---

## 7. Parser Intelligence

### Encoding Detection
```
1. Read file as ArrayBuffer
2. Run jschardet/chardet on first 4KB
3. If confidence > 0.8 → use detected encoding
4. Fallback: try UTF-8 → if garbage (ÄÅ patterns) → try Windows-1250
5. Decode entire file with detected encoding
```

### Separator Detection
```
1. Read first 10 lines (post-encoding)
2. Count occurrences of: ; , \t |
3. Separator = char with most consistent count across lines
4. Handle edge case: semicolons inside quoted fields
```

### Date Format Auto-Detection
```
1. Sample 10 values from detected "date" column
2. Try each format: DD.MM.YYYY, YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
3. Pick format where ALL samples parse to valid dates
4. Ambiguous (e.g. 01/02/2026 — Jan 2 or Feb 1?): prefer DD/MM for PL locale
```

### Amount Format Auto-Detection
```
Sample values from "amount" column:
- Contains "," as last separator → PL format (1 234,56)
- Contains "." as last separator → EN format (1,234.56)
- Mixed → use bank profile hint
```

---

## 8. Security Invariants

| Point | Guard |
|-------|-------|
| Original titles in store | Stripped from Zustand immediately after user accepts anonymization step |
| Error messages | NEVER include row content — only row index + error code |
| Console.log | Zero PII — use row indices only for debugging |
| Browser memory on navigation | Store `reset()` called on route unmount |
| Dictionary content | Not PII, but still in-memory only (no localStorage) |
| Anonymized output | Only anonymized titles leave the model/ layer |
| Clipboard | No copy-to-clipboard of original titles |
| DevTools | In production build, no access to original data through React DevTools |

---

## 9. Performance Budget

| Operation | Target | Strategy |
|-----------|--------|----------|
| Dictionary loading | <1s | Parallel fetch, gzipped, cached |
| Encoding detection | <100ms | First 4KB sample only |
| CSV parsing (1800 rows) | <500ms | papaparse streaming, Web Worker if needed |
| Anonymization (1800 rows) | <1s | Set lookups O(1), detectors run sequentially per row |
| Total wizard Step 1→3 | <3s | Perceived instant with skeleton loading |

---

## 10. User Correction Feedback

```typescript
interface UserCorrection {
  readonly text: string;        // the span text
  readonly action: 'accept' | 'reject';  // user confirmed PII or dismissed
  readonly detectorId: string;
}
```

- Stored per-workspace (backend persists)
- On next import: corrections applied as override before confidence gate
- "IKEA JANKI" rejected → added to local whitelist for future imports
- "Jan Kowalski" accepted → confidence boost for dict-matched names

---

## 11. Implementation Order

### Phase A: Foundation (types + dictionaries)
1. Rewrite `model/types.ts` — add all new types (DetectionSpan, PiiDetector, DictionarySet, etc.)
2. Create `anonymizer/dictionaries/types.ts` + `dictionary-provider.ts`
3. Create dev stubs (JSON files: names, surnames, merchants, cities, phrases)
4. Tests: dictionary loading, Set creation, lookup performance

### Phase B: Parser rewrite
5. `parser/encoding-detector.ts` — jschardet integration
6. `parser/separator-detector.ts` — statistical detection
7. `parser/date-parser.ts` — multi-format with auto-detect
8. `parser/amount-parser.ts` — multi-locale with auto-detect
9. `parser/csv-parser.ts` — orchestrator (encoding → separator → papaparse → validate)
10. Tests: real bank CSV samples (one per bank)

### Phase C: Anonymizer detectors
11. `anonymizer/detectors/types.ts` — PiiDetector interface
12. `anonymizer/detectors/iban-detector.ts` — regex + mod97
13. `anonymizer/detectors/phone-detector.ts` — PL + INT patterns
14. `anonymizer/detectors/email-detector.ts`
15. `anonymizer/detectors/name-detector.ts` — dictionary + positional heuristics
16. `anonymizer/detectors/address-detector.ts` — street patterns
17. Tests: each detector independently with 20+ test cases

### Phase D: Pipeline + masking
18. `anonymizer/conflict-resolver.ts` — span overlap resolution
19. `anonymizer/masker.ts` — type-specific masking
20. `anonymizer/pipeline.ts` — orchestrator (detect all → whitelist filter → resolve → gate → mask)
21. Integration tests: full pipeline with real-world transaction titles (50+ examples)

### Phase E: Column mapper rewrite
22. `column-mapper/bank-profiles/` — all bank profiles
23. `column-mapper/auto-detector.ts` — sample-based inference
24. `column-mapper/column-mapper.ts` — applies mapping
25. Tests: auto-detection accuracy per bank

---

## 12. Acceptance Criteria

- [ ] Parser handles Windows-1250 encoded CSVs from PKO/mBank
- [ ] Parser auto-detects `;` separator (used by most PL banks)
- [ ] Amount parser handles "1 234,56" (space thousands, comma decimal)
- [ ] Bank auto-detection works for mBank, PKO, ING (header fingerprinting)
- [ ] Name detector: ≥95% recall on names following PRZELEW keyword
- [ ] Name detector: <5% false positive rate on merchant/city names
- [ ] IBAN detector: 100% accuracy (mod97 checksum eliminates false positives)
- [ ] Phone detector: catches +48 and 9-digit formats
- [ ] Full pipeline processes 1800 rows in <2 seconds
- [ ] Zero PII in error messages, console output, or stored state
- [ ] Dictionaries load in <1 second (gzipped)
- [ ] User corrections persist and improve future imports
