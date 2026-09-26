# CSV Parser — Technical Reference

> ⚠️ **WIP:** Bank profile auto-detection (4.3.E.16) and full performance benchmarking not yet complete. Parser core is stable.

## Problem & Constraints

Polish bank CSV files are inconsistent:
- **Encoding:** UTF-8, Windows-1250, ISO-8859-2 (varies per bank, sometimes mislabeled)
- **Separator:** `;` (most PL banks), `,` (Revolut, EN exports), `\t`, `|` (Santander)
- **Date formats:** 9 formats across locales (DD.MM.YYYY, YYYY-MM-DD, DD-CZE-2025, etc.)
- **Amount formats:** comma-decimal "1 234,56" (PL) vs dot-decimal "1,234.56" (EN), NBSP thousands
- **Preamble metadata:** 0–30+ rows of bank info before actual data (mBank: 26 rows)
- **Overflow:** unescaped separators inside description fields (mBank, SBI, KBank)

**Hard constraints:**
- Client-side only — raw data never leaves the browser
- <500ms parse time for 1800 rows (typical 1-year export)
- Zero silent data loss — unparseable values return `null`, never `0`
- Works with zero configuration for all Polish banks + Revolut

**See also:** [Architecture overview](./overview.md) for module positioning, [ADR-002](../../adr/002-csv-boundary-detection-algorithm.md) for boundary detection decision history, and recovered [DEC-061](../../history/decisions/DEC-061-csv-parser-anonymizer-enterprise-grade-rewrite.md) for the enterprise rewrite rationale.

---

## Architecture Overview

```
features/csv-import/model/parser/
├── csv-parser.ts               # Orchestrator: validate → decode → boundaries → sep → parse → reassemble
├── encoding-detector.ts        # BOM check + jschardet + Polish byte heuristic fallback
├── separator-detector.ts       # Statistical: streak + mode scoring across 4 candidates
├── data-boundary-detector.ts   # 3-phase: find data by date → walk back → classify header
├── date-parser.ts              # Data-driven format registry (9 formats, 3 locales, auto-detect)
├── amount-parser.ts            # Multi-locale with NBSP, parentheses-negative, quote strip
└── strategies/
    ├── resolve-strategy.ts     # Picks reassembly strategy from header + data sampling
    ├── direct-strategy.ts      # Clean CSVs — pass-through with padding
    └── overflow-merge-strategy.ts  # Merges excess tokens into overflow column from end
```

---

## Core Interfaces

```typescript
// Input: browser File object → Output: structured rows
export const parseCsvFile = async (file: File): Promise<ParsedCsvData>;

interface ParsedCsvData {
  readonly headers: readonly string[];      // Column names (from header or positional)
  readonly rows: readonly CsvRow[];         // Record<string, string> per row
  readonly fileName: string;
  readonly encoding: string;                // Detected encoding name
  readonly separator: string;               // Detected separator char
  readonly rowCount: number;
}

// Row reassembly — Strategy Pattern for handling overflow
interface ReassemblyStrategy {
  readonly type: 'direct' | 'overflow-merge';
  reassemble(rawTokens: readonly string[], config: ReassemblyConfig): readonly string[];
}

interface ReassemblyConfig {
  readonly expectedColumnCount: number;     // From header length
  readonly separator: string;               // For re-joining overflow tokens
  readonly overflowColumnIndex?: number;    // Which column absorbs overflow
  readonly fixedTailColumns?: number;       // Columns after overflow (counted from end)
}
```

**Design choice:** `ParsedCsvData` holds raw string values, not parsed numbers/dates. Parsing to typed values happens downstream in the column-mapper, keeping the parser output format-agnostic and reusable.

---

## Algorithm: Full Pipeline (step-by-step)

### Input
Browser `File` object (user drops CSV in upload zone).

### Step 1: Validate File
```
file.name must end with .csv      → INVALID_EXTENSION
file.size must be > 0             → EMPTY_FILE
file.size must be ≤ 10 MB         → FILE_TOO_LARGE
```

### Step 2: Read + Decode
```
buffer ← file.arrayBuffer()
encoding ← detectEncoding(buffer)       // see Encoding Detection below
rawText ← TextDecoder(encoding).decode(buffer)
rawText ← stripBom(rawText)             // remove U+FEFF if present
rawText ← normalizeNbsp(rawText)        // U+00A0 → regular space (early, before any splitting)
```

**Why NBSP normalization is first:** Polish banks use NBSP as thousands separator in amounts (e.g. `1\u00A0234,56`). If left in place, subsequent splitting/trimming breaks amount parsing. Normalizing early is safe because NBSP has no structural meaning in CSV.

### Step 3: Detect Separator (first pass)
```
separator ← detectSeparator(rawText)    // needed for boundary detection
```

### Step 4: Detect Data Boundaries
```
boundaries ← detectDataBoundaries(rawText, separator)
  → { headerRow, dataStartRow, skipRows, dataText }
```
Extracts the data portion (header + data rows), discarding metadata preamble and footer. See 3-Phase Algorithm section below.

### Step 5: Re-detect Separator on Data Only
```
dataSeparator ← detectSeparator(boundaries.dataText)
```
**Why re-detect?** Metadata lines may contain different separator patterns (e.g., mBank metadata uses `;` but with different column counts). Re-detecting on clean data gives a more accurate mode.

### Step 6: Parse with papaparse
```
result ← parseCsv(dataText, { header: false, delimiter: dataSeparator, skipEmptyLines: true })
```
`header: false` because we handle header extraction ourselves (boundary detector already located it).

### Step 7: Extract Headers
```
if boundaries.headerRow !== null:
  headers ← result.data[0]        // first row of data portion is the header
  dataRows ← result.data[1:]
else:
  headers ← generatePositionalHeaders(result.data[0])   // "Column 1", "Column 2", ...
  dataRows ← result.data          // all rows are data (headerless CSV)
```

Positional headers use first-row values as identifiers (e.g. account number becomes the column name). User maps them manually in the wizard.

### Step 8: Resolve Reassembly Strategy
```
{ strategy, config } ← resolveStrategy(headers, dataRows, dataSeparator)
```
Decides Direct (clean) vs OverflowMerge (broken quoting) based on sampling. See Strategy Resolution below.

### Step 9: Reassemble + Map to Records
```
for each rawTokens in dataRows:
  assembled ← strategy.reassemble(rawTokens, config)
  row ← zip(headers, assembled) → Record<string, string>
```

### Output
`ParsedCsvData` with headers, rows, encoding, separator, rowCount, fileName.

---

## Sub-Algorithm: Encoding Detection

```
Input: ArrayBuffer (raw file bytes)
Output: encoding name (string for TextDecoder)

1. Check BOM (first 2-3 bytes):
   - EF BB BF → "utf-8"
   - FF FE    → "utf-16le"
   - FE FF    → "utf-16be"

2. Sample first 4096 bytes → run jschardet:
   - confidence ≥ 0.8 → normalize encoding name
     (windows-1252 → windows-1250 for PL context)
     (ascii → utf-8, they're compatible for plain text)

3. Low confidence fallback:
   - Scan bytes for known Windows-1250 Polish character codes
     (ą=0xB9, ć=0xE6, ę=0xEA, ł=0xB3, ń=0xF1, ś=0x9C, ź=0x9F, ż=0xBF)
   - If any found → "windows-1250"
   - Otherwise → "utf-8" (safe default)
```

**Design choice: windows-1252 → windows-1250 mapping.** jschardet often reports 1252 for Polish files because the charsets overlap significantly. Since this is a Polish-focused app, treating 1252 as 1250 is always correct for PL bank CSVs. This eliminates a common misdetection.

**Replacement char counting:** `countReplacementChars()` post-decoding counts U+FFFD characters. If count > 0, the UI can warn the user about potential encoding mismatch (CR-14 ticket).

---

## Sub-Algorithm: Separator Detection

```
Input: text (string, already decoded)
Output: separator character (';' | ',' | '\t' | '|')

1. Split into lines, filter empty, take first 30

2. For each candidate separator [';', ',', '\t', '|']:
   a. Count occurrences per line (respecting quoted fields)
   b. Find MODE: most common non-zero count across lines
   c. Find STREAK: longest consecutive run of lines with mode count (±1 tolerance)
   d. Score = modeCount × (matchRatio + streakBonus)
      where matchRatio = modeFreq / totalLines
            streakBonus = maxStreak / totalLines

3. Winner = candidate with highest score
4. Fallback: ';' (most common in Polish banks)
```

**Why streak + mode (not just frequency)?**

Naive frequency counting fails when:
- Metadata headers use the same separator with different column counts
- Footer lines have zero separators

The streak algorithm finds the longest "stable zone" — the actual data region where separator count is consistent. Even if metadata has more total separators cumulatively, the data region's consistency gives it a higher streak bonus.

**Quote-awareness:** `countUnquoted()` skips separators inside `"..."` blocks, preventing false counts from fields containing the separator character.

---

## Sub-Algorithm: 3-Phase Boundary Detection

> Full decision history in [ADR-002](../../adr/002-csv-boundary-detection-algorithm.md)

**Problem:** Bank CSVs have 0–30+ metadata lines before data. Must find where headers and data actually start.

### Phase 1: Find First Data Row (FDR)

Scan top-down (max 100 lines). A line qualifies as data if:
- Has ≥4 fields (after splitting by separator, respecting quotes)
- Field[0] or field[1] matches a date pattern

Date patterns (3 regexes with `[-/.]` flexibility — each covers dash, slash, and dot variants):
- `YYYY[-/.]MM[-/.]DD` (e.g. 2026-07-01, 2026/07/01, 2026.07.01)
- `DD[-/.]MM[-/.]YYYY` (e.g. 01.07.2026, 01/07/2026, 01-07-2026)
- `DD[-/.]MM[-/.]YY` (e.g. 01.07.26, 01/07/26)

Date validation prevents false positives:
- Extracted parts must be in valid ranges (month 1-12, day 1-31, year 1900-2099)
- Prevents version numbers (1.2.3), amounts (12.345), or timestamps from matching

**MIN_DATA_ROW_COLUMNS = 4:** Every real bank has ≥4 columns. This prevents mBank's metadata line `#Za okres:;02.07.2025;02.07.2026` (3 tokens with a date) from being misidentified as data.

### Phase 2: Walk Back from FDR

From FDR, search upward for the first non-empty line. This is the header candidate.

If FDR is row 0: no header exists (Santander-style positional CSV).

### Phase 3: Classify Header Candidate

A line is a valid header if:
- Contains ≥2 known header keywords (PL: `data`, `kwota`, `opis`, `saldo`; EN: `date`, `amount`, `description`, `balance`)
- Does NOT have date values in its first 3 fields (dates disqualify — it's a data row, not header)

If the immediate candidate fails classification:
- Continue searching further back for a line that passes
- If nothing found: `headerRow = null` → downstream uses positional mapping

**Keyword scope:** PL + EN keywords only. Exotic languages gracefully degrade to headerless mode (user maps columns manually in the wizard). This is by design — trying to support 50+ languages with keyword lists is unmaintainable.

### Fallback (no date in any line)

If Phase 1 finds no date anywhere: fall back to keyword-only scoring (find the line with the most keyword matches). This handles edge cases like receipt-style CSVs with no date column.

---

## Sub-Algorithm: Strategy Resolution (Row Reassembly)

**Problem:** Some banks (mBank, SBI, KBank) have unescaped separators inside description fields. A row might have 8 tokens but only 6 columns in the header.

### Decision Logic

```
1. Sample first 10 data rows
2. If ANY row has more tokens than headers → overflow detected
3. If overflow detected:
   a. Scan headers for overflow column keywords: opis, description, tytuł, details, szczegóły
   b. If found → OverflowMergeStrategy (with identified column index)
   c. If not found → DirectStrategy (truncate, safer than guessing)
4. If no overflow → DirectStrategy
```

### DirectStrategy
- Row length == expected → pass through
- Fewer fields → pad with empty strings
- More fields → truncate (shouldn't happen but safe fallback)

### OverflowMergeStrategy

**Key insight:** "parse from the end." The last N columns are always in fixed position (amounts, currency, balance are numeric — never contain separators). Everything between head columns and tail columns belongs to the overflow field.

```
Example (mBank, 6 expected columns, overflow at index 1):
  Header:  [Data | Opis operacji | Rachunek | Kategoria | Kwota | (empty)]
  Raw row: [2026-07-01 | ZUS | PRZELEW | 436000... | mBiznes | Ubezpieczenia | -2635.98 PLN | ""]
           ↑ head (1)   ↑ overflow tokens (3 excess)                 ↑ tail (4 from end)

  Result:  [2026-07-01 | "ZUS;PRZELEW;436000..." | mBiznes | Ubezpieczenia | -2635.98 PLN | ""]
```

Config values:
- `overflowColumnIndex = 1` (Opis is second column)
- `fixedTailColumns = 4` (expectedColumns − overflowIndex − 1)
- Merged with original separator for display fidelity

---

## Sub-Algorithm: Date Parser

### Auto-Detection (`detectDateFormat`)

```
Input: sample of 10+ date strings from a column
Output: DateFormat | null

Strategy: try each format in priority order. First format where ALL samples parse
to valid dates wins. If none matches all → null (user selects manually).
```

### Format Registry (data-driven)

9 formats defined as `{ regex, groups: {year, month, day}, yearResolver? }`:

| Format | Example | Source |
|--------|---------|--------|
| YYYY-MM-DD | 2026-07-01 | Revolut, PKO BP |
| DD.MM.YYYY | 01.07.2026 | mBank, ING |
| DD/MM/YYYY | 01/07/2026 | Generic EU |
| DD-MM-YYYY | 01-07-2026 | Millennium |
| YYYY/MM/DD | 2026/07/01 | Rare, some APIs |
| DD.MM.YY | 01.07.26 | Legacy exports |
| DD/MM/YY | 01/07/26 | Legacy exports |
| DD-MMM-YYYY | 05-CZE-2025 | Santander PL |
| DD Mon YYYY | 10 Jun 2025 | Wise, N26 |

### i18n Month Registry

Month names resolved through locale chain: PL → EN → DE. Each locale defines abbreviations + full names.

- **Polish:** sty, lut, mar, kwi, maj, cze, lip, sie, wrz, paź/paz, lis, gru + full names (with and without diacritics)
- **English:** jan–dec + full names
- **German:** jan, feb, mär/mar, apr, mai, jun, jul, aug, sep, okt, nov, dez + full names

Adding a new locale = add a `MonthLocale` object to the `MONTH_LOCALES` array.

### Flexible Parsing (`parseDateFlexible`)

For files with mixed date formats (rare but possible): tries every format sequentially until one succeeds. Used as last-resort fallback.

---

## Sub-Algorithm: Amount Parser

### Auto-Detection (`detectAmountLocale`)

```
Input: sample of amount strings
Output: 'pl' | 'en'

Heuristic:
  For each sample:
    - Last separator is comma + ≤2 digits after → PL score++
    - Last separator is dot + ≤2 digits after → EN score++
    - Space inside number (thousands) → PL score++

  Return: plScore >= enScore ? 'pl' : 'en'
```

### Parsing (`parseAmount`)

```
Input: raw string + locale
Output: number | null (NEVER silently returns 0)

Pipeline:
  1. Normalize NBSP → space, trim
  2. Strip leading single quote (Polish bank CSV quoting artifact: '1 234,56)
  3. Detect parentheses-negative: (8.50) → mark negative, unwrap
  4. Strip leading +/- (track sign)
  5. Strip currency suffix (PLN, EUR, USD, GBP, CHF, CZK)
  6. Locale-specific separator handling:
     PL: remove spaces and dots (thousands), replace comma → dot (decimal)
     EN: remove commas and spaces (thousands), dot stays as decimal
  7. parseFloat → if NaN return null
  8. Apply sign
```

**Edge cases handled:**
- `(2 350,00)` → -2350.00 (parentheses-negative with space thousands)
- `+9 200,00` → 9200.00 (leading plus)
- `'1 234,56` → 1234.56 (quote prefix from IBAN-style quoting)
- `-87.43 PLN` → -87.43 (currency suffix)
- Empty/whitespace → null (not 0)

---

## Decision Log

### 1. NBSP normalization at pipeline top (not per-field)

**Chose:** Global `text.replace(/\u00A0/g, ' ')` immediately after decoding.
**Over:** Per-field normalization in amount parser.
**Because:** NBSP appears in amount fields (thousands), description fields (banking phrases), and even headers. Normalizing once globally is simpler, cheaper, and prevents forgotten edge cases in downstream consumers.
**Trade-off:** Loses the distinction between "real space" and "formatting space" — acceptable because NBSP has zero semantic meaning in bank CSVs.

### 2. Separator re-detection on data portion

**Chose:** Detect separator twice — once on full text (for boundary detection), once on data-only text (for parsing).
**Over:** Single detection on full text.
**Because:** Metadata lines (bank name, account number, period) may use different separators or no separators at all. mBank has 26 metadata lines with varying `;` counts that skew the mode. Re-detecting on clean data gives accurate column count.
**Trade-off:** ~2ms extra computation. Negligible.

### 3. Strategy Pattern for row reassembly

**Chose:** Pluggable strategies (Direct, OverflowMerge) selected by resolver.
**Over:** Inline if/else in the parser loop.
**Because:** The overflow problem is orthogonal to parsing. Different banks need different reassembly logic. Adding a new strategy (e.g., MultilineMerge for PKO BP) should not touch the main parser.
**Trade-off:** Indirection — reader must follow resolve-strategy.ts to understand which path is taken.

### 4. `headerRow: null` for headerless CSVs (not synthetic headers)

**Chose:** Return null, let downstream generate positional identifiers from first-row content.
**Over:** Always synthesizing "Column 1", "Column 2" headers.
**Because:** First-row values in headerless CSVs (Santander) contain meaningful data like account numbers. Using them as identifiers helps the user map columns. The wizard shows actual values.
**Trade-off:** Downstream must handle both cases (named vs positional headers).

### 5. `columnBonus` removed from boundary detection

**Chose:** Pure date-first + keyword classification (no column count scoring).
**Over:** Previous algorithm that scored lines by keyword matches × column count.
**Because:** `columnBonus` caused data rows with overflow (10+ tokens) to outscore real headers (7 tokens). Failed on 4/15 test banks (SBI, KBank, VCB, Ziraat). Date presence is a universal, language-independent signal.
**Trade-off:** Requires dates to exist in the file. Files without dates fall back to keyword-only (less accurate).

---

## Performance Characteristics

| Operation | Complexity | Measured (1800 rows) |
|-----------|-----------|---------------------|
| Encoding detection | O(1) — 4KB sample | <5ms |
| Separator detection | O(lines × candidates) — 30 lines × 4 chars | <2ms |
| Boundary detection | O(lines) — max 100 lines scanned | <3ms |
| papaparse parse | O(rows × cols) — streaming | ~100-200ms |
| Strategy resolution | O(sample) — 10 rows sampled | <1ms |
| Row reassembly | O(rows × cols) | ~50ms |
| **Total pipeline** | | **<300ms for 1800 rows** |

Memory: file is read once into ArrayBuffer. Decoded text is a single string. No intermediate copies beyond the final `ParsedCsvData` output.

---

## Edge Cases & Known Limitations

### Handled Edge Cases

| Case | Solution |
|------|----------|
| BOM (U+FEFF) at file start | Stripped after decode |
| NBSP (U+00A0) in amounts/text | Normalized globally |
| 26 metadata lines (mBank) | Boundary detector skips them |
| No header (Santander) | Detected, positional identifiers used |
| Unescaped separators in descriptions | OverflowMerge strategy |
| Mixed date formats in single file | `parseDateFlexible` (last resort) |
| Short year (DD.MM.YY) | `resolveYear`: <100 → 2000+year |
| Parentheses-negative amounts | `(8.50)` → -8.50 |
| Windows-1250 mislabeled as 1252 | Normalized to 1250 |
| Quote-prefixed amounts (`'1234`) | Leading quote stripped |

### Known Limitations

| Limitation | Impact | Planned Resolution |
|-----------|--------|-------------------|
| No multiline field support | PKO BP descriptions span multiple lines — handled by papaparse quoted-field support, but unquoted multiline is lost | Bank profile system (bypass boundary detection) |
| Exotic languages → headerless | Vietnamese, Turkish, Japanese CSVs lose auto-header detection | LLM-based header detection (post-revenue) |
| No bank auto-detection in parser | Parser doesn't identify which bank the file is from | Bank profile registry (4.3.E.16) |
| Max 10MB file size | Rejects very large multi-year exports | Web Worker streaming (if needed) |
| Amount detection needs ≥1 sample | Empty amount columns → null locale → parsing skipped | Column mapper handles this case |

### What Breaks This Parser

1. **CSV with no date column at all** — boundary detection falls back to keyword scoring (less reliable)
2. **File with <4 data columns** — `MIN_DATA_ROW_COLUMNS` check prevents detection; user sees "no data" error
3. **Binary/corrupted files** — TextDecoder produces garbage; no validation beyond extension check
4. **Extremely nested quoting** (`""inside""quotes""`) — papaparse handles standard RFC 4180 quoting only

---

*Generated: 2026-07-02 | Source: `client/src/features/csv-import/model/parser/`*
