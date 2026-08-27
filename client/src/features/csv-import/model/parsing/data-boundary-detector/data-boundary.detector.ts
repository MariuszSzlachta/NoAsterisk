import type { DataBoundaries } from '#features/csv-import/model/parsing/types';
import { splitRespectingQuotes } from '#features/csv-import/model/parsing/shared/split-respecting-quotes';
import {
  SURROUNDING_QUOTES_PATTERN,
  DATE_DELIMITER_PATTERN,
  LEADING_HASH_GLOBAL_PATTERN,
} from '#features/csv-import/model/parsing/shared/patterns';

export const MIN_COLUMNS = 2;
export const MIN_DATA_ROW_COLUMNS = 4;
export const MAX_SCAN_LINES = 100;
export const KEYWORD_MATCH_THRESHOLD = 2;
export const MAX_HEADER_CHECK_FIELDS = 3;

export const DATE_PATTERNS = [
  /^\d{4}[-/.]\d{2}[-/.]\d{2}$/,
  /^\d{2}[-/.]\d{2}[-/.]\d{4}$/,
  /^\d{2}[-/.]\d{2}[-/.]\d{2}$/,
];

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2099;
export const MAX_TWO_DIGIT_YEAR = 99;

export const isDateValue = (value: string): boolean => {
  const trimmed = value.trim().replace(SURROUNDING_QUOTES_PATTERN, '');
  if (!DATE_PATTERNS.some((p) => p.test(trimmed))) return false;

  const parts = trimmed.split(DATE_DELIMITER_PATTERN).map(Number);
  if (parts.length !== 3) return false;

  const [a, b, c] = parts;
  if (a === undefined || b === undefined || c === undefined) return false;

  if (a >= MIN_YEAR && a <= MAX_YEAR) return b >= 1 && b <= 12 && c >= 1 && c <= 31;
  if (c >= MIN_YEAR && c <= MAX_YEAR) return a >= 1 && a <= 31 && b >= 1 && b <= 12;
  if (a >= 1 && a <= 31 && b >= 1 && b <= 12 && c >= 0 && c <= MAX_TWO_DIGIT_YEAR) return true;

  return false;
};

/**
 * Known header keywords for PL/EN bank CSVs (mBank, PKO BP, ING, Santander,
 * Millennium, Revolut, Wise, N26). Exotic languages degrade to headerless mode.
 */
export const HEADER_KEYWORDS = [
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

export const isHeaderLine = (line: string, separator: string): boolean => {
  const fields = splitRespectingQuotes(line, separator);
  if (fields.length < MIN_COLUMNS) return false;
  if (fields.slice(0, MAX_HEADER_CHECK_FIELDS).some((f) => isDateValue(f))) return false;

  const lower = line.toLowerCase().replace(LEADING_HASH_GLOBAL_PATTERN, '');
  const keywordHits = HEADER_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  return keywordHits >= KEYWORD_MATCH_THRESHOLD;
};

export const isDataLine = (line: string, separator: string): boolean => {
  if (line.trim().length === 0) return false;
  const fields = splitRespectingQuotes(line, separator);
  if (fields.length < MIN_DATA_ROW_COLUMNS) return false;
  return fields.slice(0, 2).some((f) => isDateValue(f));
};

export const findFirstDataRow = (lines: readonly string[], separator: string): number =>
  lines.slice(0, MAX_SCAN_LINES).findIndex((line) => isDataLine(line, separator));

export const walkBackToCandidate = (lines: readonly string[], fromIndex: number): number | null => {
  const candidates = lines
    .slice(0, fromIndex)
    .map((line, i) => ({ line, index: i }))
    .filter(({ line }) => line.trim().length > 0);

  return candidates.length > 0 ? candidates[candidates.length - 1]!.index : null;
};

export const classifyHeader = (
  lines: readonly string[],
  candidate: number | null,
  separator: string,
): number | null => {
  if (candidate === null) return null;

  const candidateLine = lines[candidate] ?? '';
  if (isHeaderLine(candidateLine, separator)) return candidate;

  const deeperSearch = lines
    .slice(0, candidate)
    .map((line, i) => ({ line, index: i }))
    .filter(({ line }) => line.trim().length > 0 && isHeaderLine(line, separator));

  return deeperSearch.length > 0 ? deeperSearch[deeperSearch.length - 1]!.index : null;
};

export const fallbackKeywordDetection = (
  allLines: readonly string[],
  separator: string,
): DataBoundaries => {
  const scored = allLines.slice(0, MAX_SCAN_LINES)
    .map((line, index) => {
      const fields = splitRespectingQuotes(line, separator);
      if (line.trim().length === 0 || fields.length < MIN_COLUMNS) return { index, score: -1 };
      const keywordHits = HEADER_KEYWORDS.filter((kw) => line.toLowerCase().includes(kw)).length;
      return { index, score: keywordHits };
    })
    .reduce((best, curr) => (curr.score > best.score ? curr : best), { index: 0, score: -1 });

  const dataLines = allLines.slice(scored.index);
  return {
    headerRow: scored.index,
    dataStartRow: scored.index + 1,
    skipRows: scored.index,
    dataText: dataLines.join('\n'),
  };
};

/**
 * 3-Phase boundary detection:
 * 1. Find First Data Row — line with date in field[0..1]
 * 2. Walk back from FDR to find header candidate
 * 3. Classify candidate with keyword heuristic
 */
export const detectDataBoundaries = (text: string, separator: string): DataBoundaries => {
  const allLines = text.split(/\r?\n/);

  const firstDataRow = findFirstDataRow(allLines, separator);
  if (firstDataRow === -1) return fallbackKeywordDetection(allLines, separator);

  const headerCandidate = walkBackToCandidate(allLines, firstDataRow);
  const headerRow = classifyHeader(allLines, headerCandidate, separator);

  const startLine = headerRow ?? firstDataRow;
  const dataText = allLines.slice(startLine).join('\n');

  return { headerRow, dataStartRow: firstDataRow, skipRows: startLine, dataText };
};
