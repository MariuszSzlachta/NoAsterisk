import type { DetectionSpan, DictionarySet, PiiDetector } from '../types';

// Full 16-digit card: 1234 5678 9012 3456 or 1234-5678-9012-3456
const FULL_CARD = /\b(\d{4})[\s-](\d{4})[\s-](\d{4})[\s-](\d{4})\b/g;

// Compact 16-digit card: 1234567890123456
const COMPACT_CARD = /\b(\d{16})\b/g;

// Partially masked cards (as banks often show them):
// **** **** **** 1234, XXXX-XXXX-XXXX-1234, ****1234
const MASKED_CARD_SPACED =
  /[*Xx]{4}[\s-][*Xx]{4}[\s-][*Xx]{4}[\s-]\d{4}/g;

// 6011...4820, 6011***4820 (prefix...suffix patterns)
const DOTTED_CARD = /\b\d{4}[.*]{2,8}\d{4}\b/g;

// ****1234 or XXXX1234 (short masked)
const SHORT_MASKED = /[*Xx]{4}\d{4}\b/g;

// First 6 + last 4 visible: 601112******4820
const BIN_LAST4 = /\b\d{6}[*Xx]{4,6}\d{4}\b/g;

/**
 * Luhn checksum validation for full card numbers.
 * Returns true if the number passes Luhn algorithm.
 */
const validateLuhn = (digits: string): boolean => {
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let alternate = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    const char = digits[i];
    if (char === undefined) {
      return false;
    }
    let n = parseInt(char, 10);

    if (alternate) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }

    sum += n;
    alternate = !alternate;
  }

  return sum % 10 === 0;
};

/**
 * Check if a 16-digit number looks like a card (starts with known BIN prefixes).
 * Visa: 4xxx, Mastercard: 51-55 or 2221-2720, Maestro: 5018/5020/6xxx
 */
const hasCardPrefix = (digits: string): boolean => {
  const first = digits[0];
  const firstTwo = digits.slice(0, 2);
  const firstFour = digits.slice(0, 4);

  // Visa
  if (first === '4') {
    return true;
  }
  // Mastercard
  if (
    (firstTwo >= '51' && firstTwo <= '55') ||
    (firstFour >= '2221' && firstFour <= '2720')
  ) {
    return true;
  }
  // Maestro / other
  if (first === '6' || firstTwo === '50') {
    return true;
  }
  // Amex (15 digits, but sometimes padded to 16)
  if (firstTwo === '34' || firstTwo === '37') {
    return true;
  }

  return false;
};

export const cardDetector: PiiDetector = {
  id: 'card',
  priority: 88,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const spans: DetectionSpan[] = [];

    // 1. Full 16-digit with separators
    FULL_CARD.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = FULL_CARD.exec(text)) !== null) {
      const digits = match[0].replace(/[\s-]/g, '');
      if (hasCardPrefix(digits) && validateLuhn(digits)) {
        spans.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'card',
          confidence: 0.99,
          original: match[0],
          detectorId: 'card',
          metadata: { checksumValid: true, format: 'full' },
        });
      }
    }

    // 2. Compact 16-digit
    COMPACT_CARD.lastIndex = 0;
    while ((match = COMPACT_CARD.exec(text)) !== null) {
      const digits = match[0];
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;

      // Skip if overlaps with already-found span (IBAN might grab it)
      const overlaps = spans.some(
        (s) => matchStart < s.end && matchEnd > s.start,
      );
      if (overlaps) {
        continue;
      }
      if (hasCardPrefix(digits) && validateLuhn(digits)) {
        spans.push({
          start: matchStart,
          end: matchEnd,
          type: 'card',
          confidence: 0.97,
          original: match[0],
          detectorId: 'card',
          metadata: { checksumValid: true, format: 'compact' },
        });
      }
    }

    // 3. Partially masked patterns — high confidence (bank already masked it = confirms it's a card)
    // Order matters: longer patterns first to prevent shorter ones from eating their tails
    for (const pattern of [
      MASKED_CARD_SPACED,
      BIN_LAST4,
      DOTTED_CARD,
      SHORT_MASKED,
    ]) {
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        const matchOriginal = match[0];

        const overlaps = spans.some(
          (s) => matchStart < s.end && matchEnd > s.start,
        );
        if (overlaps) {
          continue;
        }
        spans.push({
          start: matchStart,
          end: matchEnd,
          type: 'card',
          confidence: 0.92,
          original: matchOriginal,
          detectorId: 'card',
          metadata: { format: 'masked' },
        });
      }
    }

    return spans;
  },
};
