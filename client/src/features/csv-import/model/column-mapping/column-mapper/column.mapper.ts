import type { ColumnMapping, DomainField } from '../types';
import { defaultHeaderHeuristicRegistry, type HeaderHeuristicRegistry } from '../heuristics';

const VALID_DOMAIN_FIELDS: ReadonlySet<string> = new Set<DomainField>([
  'date', 'title', 'amount', 'currency', 'balance', 'debit', 'credit', 'category',
]);

/**
 * Type guard: checks if a string is a valid DomainField.
 */
export const isDomainField = (value: string): value is DomainField =>
  VALID_DOMAIN_FIELDS.has(value);

/**
 * Check if a column mapping has the minimum required fields for transformation.
 * Required: date + title + (amount OR debit/credit).
 */
export const hasRequiredFields = (mapping: ColumnMapping): boolean => {
  const fields = Object.values(mapping).filter(Boolean) as DomainField[];
  const hasDate = fields.includes('date');
  const hasTitle = fields.includes('title');
  const hasAmount =
    fields.includes('amount') ||
    fields.includes('debit') ||
    fields.includes('credit');
  return hasDate && hasTitle && hasAmount;
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

/**
 * Auto-detect column mapping from CSV headers using heuristic registry.
 * Accepts an optional registry for extensibility (user-defined heuristics).
 */
export const autoDetectMapping = (
  headers: readonly string[],
  registry: HeaderHeuristicRegistry = defaultHeaderHeuristicRegistry,
): ColumnMapping => {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<DomainField>();

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    const field = registry.match(normalized);
    if (field && !usedFields.has(field)) {
      mapping[header] = field;
      usedFields.add(field);
    }
  }
  return mapping;
};
