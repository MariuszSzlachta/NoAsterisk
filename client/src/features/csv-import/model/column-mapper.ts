import type { ColumnMapping, DomainField } from './types';

const HEADER_HEURISTICS: Record<string, DomainField> = {
  'data operacji': 'date',
  'data transakcji': 'date',
  'data księgowania': 'date',
  'data waluty': 'date',
  data: 'date',
  date: 'date',
  'opis operacji': 'title',
  'tytuł operacji': 'title',
  tytuł: 'title',
  opis: 'title',
  szczegóły: 'title',
  description: 'title',
  title: 'title',
  kwota: 'amount',
  'kwota operacji': 'amount',
  wartość: 'amount',
  amount: 'amount',
  waluta: 'currency',
  currency: 'currency',
  'saldo po operacji': 'balance',
  'saldo końcowe': 'balance',
  saldo: 'balance',
  balance: 'balance',
  // Debit/credit split columns (Kwota Wn = debit, Kwota Ma = credit)
  'kwota wn': 'debit',
  'kwota winien': 'debit',
  obciążenia: 'debit',
  obciazenia: 'debit',
  wydatki: 'debit',
  debit: 'debit',
  'kwota ma': 'credit',
  uznania: 'credit',
  wpływy: 'credit',
  wplywy: 'credit',
  credit: 'credit',
};

/**
 * Normalize a CSV header for heuristic matching.
 * Strips leading #, surrounding quotes, parenthetical suffixes,
 * BOM characters, and normalizes whitespace + case.
 *
 * Examples:
 *  - '#Data operacji' → 'data operacji'
 *  - '"Kwota (PLN)"' → 'kwota'
 *  - 'Saldo po operacji ' → 'saldo po operacji'
 *  - '#Kwota' → 'kwota'
 */
export const normalizeHeader = (header: string): string => {
  let normalized = header;

  // Strip BOM (zero-width no-break space)
  normalized = normalized.replace(/^\uFEFF/, '');

  // Strip leading # characters (mBank format) — before quote strip
  normalized = normalized.replace(/^#+\s*/, '');

  // Strip surrounding quotes (single or double)
  normalized = normalized.replace(/^["']+|["']+$/g, '');

  // Strip parenthetical suffixes like "(PLN)", "(zł)", "(EUR)"
  normalized = normalized.replace(/\s*\([^)]*\)\s*$/, '');

  // Normalize whitespace and trim
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Lowercase for matching
  normalized = normalized.toLowerCase();

  return normalized;
};

export const autoDetectMapping = (
  headers: readonly string[],
): ColumnMapping => {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<DomainField>();

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    const field = HEADER_HEURISTICS[normalized];
    if (field && !usedFields.has(field)) {
      mapping[header] = field;
      usedFields.add(field);
    }
  }
  return mapping;
};
