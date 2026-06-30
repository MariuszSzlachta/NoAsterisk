import type { AmountLocale } from '../types';

// Non-breaking space (used in Polish bank exports as thousands separator)
const NBSP = '\u00A0';

/**
 * Detect amount locale from sample values.
 * PL: "1 234,56" or "-87,43" (comma = decimal)
 * EN: "1,234.56" or "-87.43" (dot = decimal)
 */
export const detectAmountLocale = (
  samples: readonly string[],
): AmountLocale => {
  let plScore = 0;
  let enScore = 0;

  for (const raw of samples) {
    const s = normalizeWhitespace(raw.trim());
    if (!s || s === '') {
      continue;
    }

    // Strip parentheses and leading +/- for analysis
    const stripped = s.replace(/^[()+-]+|[()]+$/g, '');

    // Comma after last dot → PL (e.g. "1.234,56" — PL uses dot as thousands sometimes)
    // Dot after last comma → EN (e.g. "1,234.56")
    const lastComma = stripped.lastIndexOf(',');
    const lastDot = stripped.lastIndexOf('.');

    if (lastComma > lastDot && lastComma > 0) {
      // Comma is last separator → likely PL decimal
      const afterComma = stripped.slice(lastComma + 1);
      if (afterComma.length <= 2 && /^\d+$/.test(afterComma)) {
        plScore++;
        continue;
      }
    }

    if (lastDot > lastComma && lastDot > 0) {
      // Dot is last separator → likely EN decimal
      const afterDot = stripped.slice(lastDot + 1);
      if (afterDot.length <= 2 && /^\d+$/.test(afterDot)) {
        enScore++;
        continue;
      }
    }

    // No separator or integer → neutral, check for space thousands (PL pattern)
    if (/\d\s\d/.test(s)) {
      plScore++;
    }
  }

  return plScore >= enScore ? 'pl' : 'en';
};

/**
 * Normalize whitespace: replace NBSP with regular space, trim.
 */
const normalizeWhitespace = (value: string): string =>
  value.replace(new RegExp(NBSP, 'g'), ' ').trim();

/**
 * Parse amount string to number using detected locale.
 * Returns null for unparseable values (never silently returns 0).
 *
 * Handles:
 * - NBSP (non-breaking space) as thousands separator
 * - Parentheses as negative: (8.50) → -8.50, (2 350.00) → -2350.00
 * - Leading + sign: +9 200,00 → 9200.00
 * - Polish format: "1 234,56" (space thousands, comma decimal)
 * - English format: "1,234.56" (comma thousands, dot decimal)
 * - Polish quote marks around amounts in CSV: '1 234,56
 */
export const parseAmount = (
  value: string,
  locale: AmountLocale,
): number | null => {
  let cleaned = normalizeWhitespace(value);
  if (cleaned === '') {
    return null;
  }

  // Strip leading single quote (Polish bank CSV quoting for IBANs/amounts)
  if (cleaned.startsWith("'")) {
    cleaned = cleaned.slice(1);
  }

  // Detect parentheses-negative: (amount) → negative
  let isNegative = false;
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    isNegative = true;
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Strip leading + sign
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1).trim();
  }

  // Handle explicit leading minus
  if (cleaned.startsWith('-')) {
    isNegative = true;
    cleaned = cleaned.slice(1).trim();
  }

  // Strip currency suffixes (PLN, EUR, etc.)
  cleaned = cleaned.replace(/\s*(PLN|EUR|USD|GBP|CHF|CZK)\s*$/i, '').trim();

  if (locale === 'pl') {
    // PL: space/dot as thousands separator, comma as decimal
    cleaned = cleaned.replace(/[\s.]/g, '').replace(',', '.');
  } else {
    // EN: comma as thousands separator, dot as decimal
    cleaned = cleaned.replace(/[,\s]/g, '');
  }

  const num = parseFloat(cleaned);
  if (isNaN(num)) {
    return null;
  }

  return isNegative ? -Math.abs(num) : num;
};
