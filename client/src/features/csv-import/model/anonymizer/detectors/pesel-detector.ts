import type { DetectionSpan, DictionarySet, PiiDetector } from '../../types';

// PESEL: exactly 11 digits, not preceded/followed by another digit
const PESEL_PATTERN = /(?<!\d)(\d{11})(?!\d)/g;

// Context keywords that appear near PESEL numbers
const PESEL_CONTEXT = ['pesel', 'pesel:', 'nr pesel', 'numer pesel'];

// PESEL checksum weights
const PESEL_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];

/**
 * Validate PESEL checksum (mod 10 weighted sum).
 */
const validatePesel = (digits: string): boolean => {
  if (digits.length !== 11) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const d = parseInt(digits[i] ?? '0', 10);
    const w = PESEL_WEIGHTS[i] ?? 0;
    sum += d * w;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(digits[10] ?? '-1', 10);
};

/**
 * Validate that PESEL encodes a plausible birth date.
 * Month encoding: 01-12 (1900s), 21-32 (2000s), 41-52 (2100s).
 */
const hasValidBirthDate = (digits: string): boolean => {
  const monthRaw = parseInt(digits.slice(2, 4), 10);
  const day = parseInt(digits.slice(4, 6), 10);

  // Extract actual month from encoded value
  let month: number;
  if (monthRaw >= 1 && monthRaw <= 12) {
    month = monthRaw;
  } else if (monthRaw >= 21 && monthRaw <= 32) {
    month = monthRaw - 20;
  } else if (monthRaw >= 41 && monthRaw <= 52) {
    month = monthRaw - 40;
  } else {
    return false;
  }

  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
};

const hasPeselContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 25), start).toLowerCase();
  return PESEL_CONTEXT.some((kw) => prefix.includes(kw));
};

export const peselDetector: PiiDetector = {
  id: 'pesel',
  priority: 92,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const spans: DetectionSpan[] = [];
    PESEL_PATTERN.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = PESEL_PATTERN.exec(text)) !== null) {
      const digits = match[1] ?? match[0];
      if (!validatePesel(digits) || !hasValidBirthDate(digits)) {
        continue;
      }

      const hasContext = hasPeselContext(text, match.index);
      const confidence = hasContext ? 0.99 : 0.88;

      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'pesel',
        confidence,
        original: match[0],
        detectorId: 'pesel',
        metadata: { checksumValid: true, hasContext },
      });
    }

    return spans;
  },
};
