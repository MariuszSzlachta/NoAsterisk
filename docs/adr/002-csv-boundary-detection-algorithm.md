# ADR-002: CSV Boundary Detection — 3-Phase Algorithm

**Date:** 2026-07-02  
**Status:** Implemented  
**Context:** CSV parser for bank statement imports

---

## Problem

Bank CSV files have metadata preambles (bank name, account info, period) before the actual data. The boundary detector must find where the header and data begin.

Previous algorithm used keyword scoring + `columnBonus` (prefer lines with more separators). This failed when data rows had more separators than the header due to unescaped separators in description fields (overflow).

**Failing cases:** Indian SBI, Thai KBank, Vietnamese VCB, Turkish Ziraat — all had data rows with 10-13 tokens vs header with 7 tokens. `columnBonus` caused data rows to win over real headers.

## Solution: 3-Phase Algorithm

### Phase 1: Find First Data Row (FDR)
- Scan top-down for first line with **date pattern** in field[0] or field[1]
- Require `MIN_DATA_ROW_COLUMNS = 4` (prevents metadata with dates from matching)
- Date validation includes range checks (prevents version numbers, amounts)
- Date patterns: `YYYY-MM-DD`, `DD/MM/YYYY`, `DD.MM.YYYY`, `DD/MM/YY`

### Phase 2: Walk Back
- From FDR, find closest preceding non-empty line as header candidate
- If FDR === 0: `headerRow = null` (headerless CSV like Santander)

### Phase 3: Classify Candidate
- Header must have ≥2 keyword matches (PL + EN) AND no date values in first 3 fields
- If immediate candidate fails, search further back
- If nothing found: `headerRow = null`

### Fallback
- If no date found in any line (Phase 1 fails): keyword-only scoring without columnBonus

## Key Design Decisions

1. **`columnBonus` removed entirely** — root cause of all 4 failures
2. **Date patterns are language-independent** — universal signal for "this is data"
3. **MIN_DATA_ROW_COLUMNS = 4** — every Polish bank has ≥4 columns; prevents mBank's `#Za okres:;02.07.2025;02.07.2026` (3 tokens) from being detected as data
4. **No footer detection** — papaparse handles multiline quoted fields (PKO BP) and trailing empty lines
5. **Keyword scope: PL + EN only** — exotic languages degrade to headerless mode (user maps manually)
6. **headerRow can be null** — signals "use positional mapping" to downstream code

## Strategy Pattern (Row Reassembly)

Separate concern from boundary detection:
- **DirectStrategy** — clean CSVs, no overflow (Santander, Revolut, PKO BP)
- **OverflowMergeStrategy** — merge excess tokens into overflow column from end (mBank, SBI, KBank)
- **Resolver** — picks strategy by sampling data rows for overflow + keyword matching on headers

## Test Results

| # | File | Header | Strategy | Status |
|---|---|---|---|---|
| 01 | Revolut | row 0 | direct | ✅ |
| 02 | mBank stub | row 0 | overflow-merge | ✅ |
| 03 | PKO BP (multiline) | row 6 | direct | ✅ |
| 04 | Mixed easy | row 0 | direct | ✅ |
| 05 | Mixed hard | row 7 | overflow-merge | ✅ |
| 06 | Japanese MUFG | row 16 | direct | ✅ |
| 07 | UAE Islamic | row 6 | direct | ✅ |
| 08 | Deceptive simple | row 0 | direct | ✅ |
| 09 | Ethiopian CBE | row 5 | direct | ✅ |
| 10 | Korean Toss | row 5 | direct | ✅ |
| 11 | Indian SBI | row 7 | overflow-merge | ✅ (FIXED) |
| 12 | Thai KBank | row 6 | overflow-merge | ✅ (FIXED) |
| 13 | Nigerian GTB | row 8 | overflow-merge | ✅ |
| 14 | Vietnamese VCB | null | direct (headerless) | ✅ (designed) |
| 15 | Turkish Ziraat | null | direct (headerless) | ✅ (designed) |
| mBank real (2 files) | row 26 | overflow-merge | ✅ |
| Santander real | null | direct (headerless) | ✅ |

## Assumptions

- Every real bank CSV has ≥4 data columns (date + description + amount + at least one more)
- Date always appears in first or second field of data rows
- Polish + English keywords cover all banks available in Poland + international services
- Headerless fallback is acceptable UX (user maps columns in step 2)

## Future Considerations

- LLM-based header detection for exotic languages (when app generates revenue)
- Bank profile system could bypass boundary detection entirely (known skip rows per bank)
- Unit tests for boundary detector (pure function, zero mocks, high combinatorial value)
