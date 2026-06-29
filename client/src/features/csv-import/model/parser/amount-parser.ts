import type { AmountLocale } from '../types';

/**
 * Detect amount locale from sample values.
 * PL: "1 234,56" or "-87,43" (comma = decimal)
 * EN: "1,234.56" or "-87.43" (dot = decimal)
 */
export const detectAmountLocale = (samples: readonly string[]): AmountLocale => {
  let plScore = 0;
  let enScore = 0;

  for (const raw of samples) {
    const s = raw.trim();
    if (!s) continue;

    // Comma after last dot → PL (e.g. "1.234,56" — PL uses dot as thousands sometimes)
    // Dot after last comma → EN (e.g. "1,234.56")
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');

    if (lastComma > lastDot && lastComma > 0) {
      // Comma is last separator → likely PL decimal
      const afterComma = s.slice(lastComma + 1);
      if (afterComma.length <= 2 && /^\d+$/.test(afterComma)) {
        plScore++;
        continue;
      }
    }

    if (lastDot > lastComma && lastDot > 0) {
      // Dot is last separator → likely EN decimal
      const afterDot = s.slice(lastDot + 1);
      if (afterDot.length <= 2 && /^\d+$/.test(afterDot)) {
        enScore++;
        continue;
      }
    }

    // No separator or integer → neutral, check for space thousands (PL pattern)
    if (/\d\s\d/.test(s)) plScore++;
  }

  return plScore >= enScore ? 'pl' : 'en';
};

/**
 * Parse amount string to number using detected locale.
 */
export const parseAmount = (value: string, locale: AmountLocale): number => {
  let cleaned = value.trim();

  if (locale === 'pl') {
    // Remove space/dot thousands separators, convert comma decimal to dot
    cleaned = cleaned.replace(/[\s.]/g, '').replace(',', '.');
  } else {
    // Remove comma thousands separators
    cleaned = cleaned.replace(/,/g, '');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};
