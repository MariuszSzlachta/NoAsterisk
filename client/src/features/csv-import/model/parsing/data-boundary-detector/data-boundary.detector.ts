/**
 * Detect where actual CSV data begins in raw text.
 *
 * 3-Phase Algorithm:
 * 1. Find First Data Row (FDR) — first line with a date pattern in field[0] or field[1]
 * 2. Walk Back — from FDR, look for the closest preceding non-empty line as header candidate
 * 3. Classify Candidate — check if candidate has header keywords and NO date values
 *
 * Handles:
 * - Metadata before headers (mBank: 26 rows, SBI: 7 rows)
 * - Header at row 0 (Revolut, generic CSVs)
 * - No header / pseudoheader (Santander: row 0 has account data)
 * - Overflow in descriptions (data rows with more separators than header)
 */

const MIN_COLUMNS = 2;
const MIN_DATA_ROW_COLUMNS = 4;
const MAX_SCAN_LINES = 100;

// ─── Date Detection ──────────────────────────────────────────────

const DATE_PATTERNS = [
  /^\d{4}[-/.]\d{2}[-/.]\d{2}$/,   // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
  /^\d{2}[-/.]\d{2}[-/.]\d{4}$/,   // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  /^\d{2}[-/.]\d{2}[-/.]\d{2}$/,   // DD/MM/YY, DD.MM.YY
];

/**
 * Check if a string looks like a date value.
 * Guards against false positives: version numbers (1.2.3), amounts (12.345,67).
 * Validates that numeric segments fall within plausible date ranges.
 */
const isDateValue = (value: string): boolean => {
  const trimmed = value.trim().replace(/^"|"$/g, '');
  if (!DATE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return false;
  }

  // Extract numeric parts and validate ranges
  const parts = trimmed.split(/[-/.]/).map(Number);
  if (parts.length !== 3) {
    return false;
  }

  const [a, b, c] = parts;
  if (a === undefined || b === undefined || c === undefined) {
    return false;
  }

  // YYYY-MM-DD: year 1900-2099, month 1-12, day 1-31
  if (a >= 1900 && a <= 2099) {
    return b >= 1 && b <= 12 && c >= 1 && c <= 31;
  }
  // DD-MM-YYYY: day 1-31, month 1-12, year 1900-2099
  if (c >= 1900 && c <= 2099) {
    return a >= 1 && a <= 31 && b >= 1 && b <= 12;
  }
  // DD-MM-YY: day 1-31, month 1-12, year 0-99
  if (a >= 1 && a <= 31 && b >= 1 && b <= 12 && c >= 0 && c <= 99) {
    return true;
  }

  return false;
};

// ─── Header Keywords ─────────────────────────────────────────────

/**
 * Known header column keywords for Polish (PL) and English (EN) bank CSVs.
 * Scope: targets banks available in Poland (mBank, PKO BP, ING, Santander,
 * Millennium) and international services (Revolut, Wise, N26).
 *
 * Exotic languages (Vietnamese, Turkish, Japanese, etc.) are NOT covered —
 * those CSVs gracefully degrade to headerless mode where user maps columns
 * manually in the UI.
 */
const HEADER_KEYWORDS = [
  'data', 'date', 'started', 'completed', 'value',
  'kwota', 'amount', 'debit', 'credit', 'fee',
  'opis', 'description', 'details', 'title', 'memo',
  'saldo', 'balance',
  'tytuł', 'typ', 'type', 'state', 'status',
  'waluta', 'currency',
  'operacja', 'operacji', 'transaction', 'trans',
  'numer', 'ref', 'reference',
  'kategoria', 'category',
  'nadawca', 'odbiorca', 'counterparty', 'beneficiary', 'payee',
  'rachunek', 'account', 'channel',
  'szczegóły', 'product',
  'withdrawal', 'deposit',
];

const KEYWORD_MATCH_THRESHOLD = 2;

/**
 * Check if a line looks like a header row (has column name keywords, no date values).
 */
const isHeaderLine = (line: string, separator: string): boolean => {
  const fields = splitRespectingQuotes(line, separator);
  if (fields.length < MIN_COLUMNS) {
    return false;
  }

  // Disqualify: if any of the first 3 fields is a date → this is data, not header
  const fieldsToCheck = fields.slice(0, 3);
  if (fieldsToCheck.some((f) => isDateValue(f))) {
    return false;
  }

  // Count keyword matches across all fields
  const lower = line.toLowerCase().replace(/^#/gm, '');
  const keywordHits = HEADER_KEYWORDS.filter((kw) => lower.includes(kw)).length;

  return keywordHits >= KEYWORD_MATCH_THRESHOLD;
};

// ─── Utilities ───────────────────────────────────────────────────

/**
 * Split a line by separator, respecting quoted fields.
 */
const splitRespectingQuotes = (line: string, separator: string): string[] => {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === separator && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
};

// ─── Main Interface ──────────────────────────────────────────────

export interface DataBoundaries {
  /** Index of the header row (null = no keyword header found, use positional) */
  readonly headerRow: number | null;
  /** Index of the first data row */
  readonly dataStartRow: number;
  /** Number of metadata lines before data (= dataStartRow or headerRow) */
  readonly skipRows: number;
  /** The text content with header (if found) + data rows */
  readonly dataText: string;
}

/**
 * 3-Phase boundary detection algorithm.
 *
 * Phase 1: Find First Data Row (FDR) — line with date in field[0..1]
 * Phase 2: Walk back from FDR to find header candidate
 * Phase 3: Classify candidate with keyword heuristic
 */
export const detectDataBoundaries = (
  text: string,
  separator: string,
): DataBoundaries => {
  const allLines = text.split(/\r?\n/);

  // ─── Phase 1: Find First Data Row ───────────────────────────────
  let firstDataRow = -1;

  for (let i = 0; i < Math.min(allLines.length, MAX_SCAN_LINES); i++) {
    const line = allLines[i];
    if (line === undefined || line.trim().length === 0) {
      continue;
    }

    const fields = splitRespectingQuotes(line, separator);
    if (fields.length < MIN_DATA_ROW_COLUMNS) {
      continue;
    }

    // Check first 2 fields for date pattern
    const hasDate = fields.slice(0, 2).some((f) => isDateValue(f));
    if (hasDate) {
      firstDataRow = i;
      break;
    }
  }

  // Fallback: no date found — use old keyword scoring as last resort
  if (firstDataRow === -1) {
    return fallbackKeywordDetection(allLines, separator);
  }

  // ─── Phase 2: Walk Back from FDR ───────────────────────────────
  let headerCandidate: number | null = null;

  for (let i = firstDataRow - 1; i >= 0; i--) {
    const line = allLines[i];
    if (line === undefined || line.trim().length === 0) {
      continue;
    }
    // First non-empty line above FDR is candidate
    headerCandidate = i;
    break;
  }

  // ─── Phase 3: Classify Header Candidate ─────────────────────────
  let headerRow: number | null = null;

  if (headerCandidate !== null) {
    const candidateLine = allLines[headerCandidate] ?? '';
    if (isHeaderLine(candidateLine, separator)) {
      headerRow = headerCandidate;
    } else {
      // Candidate doesn't look like a header — maybe it's another metadata line.
      // Keep searching further back for a real header.
      for (let i = headerCandidate - 1; i >= 0; i--) {
        const line = allLines[i];
        if (line === undefined || line.trim().length === 0) {
          continue;
        }
        if (isHeaderLine(line, separator)) {
          headerRow = i;
          break;
        }
      }
    }
  }

  // ─── Build Result ───────────────────────────────────────────────
  const startLine = headerRow ?? firstDataRow;
  const dataLines = allLines.slice(startLine);
  const dataText = dataLines.join('\n');

  return {
    headerRow,
    dataStartRow: firstDataRow,
    skipRows: startLine,
    dataText,
  };
};

// ─── Fallback ────────────────────────────────────────────────────

/**
 * Fallback for files with no recognizable date patterns (edge case).
 * Uses keyword scoring without columnBonus.
 */
const fallbackKeywordDetection = (
  allLines: string[],
  separator: string,
): DataBoundaries => {
  let bestIndex = 0;
  let bestScore = -1;

  for (let i = 0; i < Math.min(allLines.length, MAX_SCAN_LINES); i++) {
    const line = allLines[i];
    if (line === undefined || line.trim().length === 0) {
      continue;
    }

    const fields = splitRespectingQuotes(line, separator);
    if (fields.length < MIN_COLUMNS) {
      continue;
    }

    const lower = line.toLowerCase();
    const keywordHits = HEADER_KEYWORDS.filter((kw) => lower.includes(kw)).length;

    if (keywordHits > bestScore) {
      bestScore = keywordHits;
      bestIndex = i;
    }
  }

  const dataLines = allLines.slice(bestIndex);
  const dataText = dataLines.join('\n');

  return {
    headerRow: bestIndex,
    dataStartRow: bestIndex + 1,
    skipRows: bestIndex,
    dataText,
  };
};
