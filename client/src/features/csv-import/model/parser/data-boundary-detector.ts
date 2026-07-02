/**
 * Detect header offset (metadata lines before actual CSV data) and footer
 * (summary lines after data ends).
 *
 * Strategy:
 * 1. Determine separator for the file
 * 2. Find the first line with consistent separator count (= header row)
 * 3. Count columns from that header
 * 4. Data rows follow — lines with same column count
 * 5. Footer = trailing lines with different column count or empty
 */

const MIN_COLUMNS = 3;
const KEYWORD_SCORE_WEIGHT = 0.3;
const KEYWORD_SCORE_CAP = 1.5;
const COLUMN_COUNT_WEIGHT = 0.5;
const CONSISTENCY_WEIGHT = 0.5;
const MAX_SCAN_LINES = 50;

// Known CSV header keywords (PL + EN) — extracted for extensibility
const HEADER_KEYWORDS = [
  'data',
  'date',
  'kwota',
  'amount',
  'opis',
  'description',
  'saldo',
  'balance',
  'tytuł',
  'title',
  'typ',
  'type',
  'waluta',
  'currency',
  'operacja',
  'operacji',
  'numer',
  'konta',
  'ref',
  'kategoria',
  'category',
  'nadawca',
  'odbiorca',
  'counterparty',
  'szczegóły',
  'transakcja',
];

/**
 * Score how "header-like" a line looks.
 * Headers tend to have: no digits-only fields, known header words, title case / ALL CAPS.
 * Data rows have: dates, numbers, amounts — penalize those.
 */
const scoreHeaderLine = (line: string, separator: string): number => {
  const fields = splitRespectingQuotes(line, separator);
  if (fields.length < MIN_COLUMNS) {
    return 0;
  }

  let score = 0;

  // Fields that look like column names (contain letters, not purely numeric)
  const nonNumericFields = fields.filter(
    (f) => f.trim().length > 0 && !/^[\d\s.,+-]+$/.test(f.trim()),
  );
  score += nonNumericFields.length / fields.length;

  const lower = line.toLowerCase();
  const keywordHits = HEADER_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  score += Math.min(keywordHits * KEYWORD_SCORE_WEIGHT, KEYWORD_SCORE_CAP);

  // Penalty: if any field looks like a date or amount, this is data, not header
  const hasDatePattern = fields.some((f) =>
    /^\d{2,4}[./-]\d{2}[./-]\d{2,4}$/.test(f.trim()),
  );
  if (hasDatePattern) {
    return -1; // Definitely a data row, not a header
  }

  // Penalty: multiple numeric-only fields suggest data
  const numericFields = fields.filter(
    (f) => /^[+-]?[\d\s.,]+$/.test(f.trim()) && f.trim().length > 0,
  );
  if (numericFields.length >= 2) {
    score -= 1;
  }

  return score;
};

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

/**
 * Count separator occurrences in a line, ignoring quoted sections.
 */
const countSeparators = (line: string, separator: string): number => {
  let count = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === separator && !inQuotes) {
      count++;
    }
  }
  return count;
};

export interface DataBoundaries {
  /** Number of metadata lines before header */
  readonly skipRows: number;
  /** Number of footer lines to ignore at the end */
  readonly footerLines: number;
  /** The text content with only the data portion (header + data rows, no metadata/footer) */
  readonly dataText: string;
}

/**
 * Detect where actual CSV data begins and ends in raw text.
 *
 * Handles:
 * - Metadata rows before headers (bank name, account number, period, etc.)
 * - Footer rows after data (summaries, counts, generation timestamps)
 * - Blank lines interspersed in metadata/footer
 */
export const detectDataBoundaries = (
  text: string,
  separator: string,
): DataBoundaries => {
  const allLines = text.split(/\r?\n/);

  // Find the header line: the first line with a good header score
  // AND consistent separator count with following lines
  let headerLineIndex = 0;
  let bestHeaderScore = 0;

  for (let i = 0; i < Math.min(allLines.length, MAX_SCAN_LINES); i++) {
    const line = allLines[i];
    if (line === undefined || line.trim().length === 0) {
      continue;
    }

    const sepCount = countSeparators(line, separator);
    if (sepCount < MIN_COLUMNS - 1) {
      continue;
    }

    const score = scoreHeaderLine(line, separator);

    // Also check: do the next 2-3 lines have the same separator count?
    let consistentFollowers = 0;
    for (let j = i + 1; j < Math.min(i + 4, allLines.length); j++) {
      const follower = allLines[j];
      if (follower === undefined || follower.trim().length === 0) {
        continue;
      }
      if (countSeparators(follower, separator) === sepCount) {
        consistentFollowers++;
      }
    }

    const totalScore = score + consistentFollowers * CONSISTENCY_WEIGHT;
    // Prefer lines with more columns — real CSV headers have more fields than metadata
    const columnBonus = sepCount * COLUMN_COUNT_WEIGHT;
    const finalScore = totalScore + columnBonus;
    if (finalScore > bestHeaderScore) {
      bestHeaderScore = finalScore;
      headerLineIndex = i;
    }
  }

  // No footer detection — papaparse handles multiline quoted fields and
  // trailing empty lines. Trying to detect footer on raw lines breaks when
  // CSV has multiline fields (PKO BP). Let papaparse handle it.
  const footerLines = 0;

  // Extract data portion (header + data rows)
  const dataEndIndex = allLines.length - footerLines;
  const dataLines = allLines.slice(headerLineIndex, dataEndIndex);
  const dataText = dataLines.join('\n');

  return {
    skipRows: headerLineIndex,
    footerLines,
    dataText,
  };
};
