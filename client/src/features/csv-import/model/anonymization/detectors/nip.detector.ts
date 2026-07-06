import type { DetectionSpan, DictionarySet, PiiDetector } from '../types';

// NIP: 10 digits, optionally with dashes (123-456-78-90 or 1234567890)
const NIP_DASHED = /(?<!\d)(\d{3})-(\d{3})-(\d{2})-(\d{2})(?!\d)/g;
const NIP_COMPACT = /(?<!\d)(\d{10})(?!\d)/g;

// Context keywords
const NIP_CONTEXT = ['nip', 'nip:', 'nr nip', 'numer nip', 'nip nr'];

// NIP checksum weights (mod 11)
const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

/**
 * Validate NIP checksum (mod 11 weighted sum).
 */
const validateNip = (digits: string): boolean => {
  if (digits.length !== 10) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const d = parseInt(digits[i] ?? '0', 10);
    const w = NIP_WEIGHTS[i] ?? 0;
    sum += d * w;
  }

  const checkDigit = sum % 11;
  // checkDigit of 10 means NIP is invalid
  if (checkDigit === 10) {
    return false;
  }

  return checkDigit === parseInt(digits[9] ?? '-1', 10);
};

const hasNipContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 20), start).toLowerCase();
  return NIP_CONTEXT.some((kw) => prefix.includes(kw));
};

export const nipDetector: PiiDetector = {
  id: 'nip',
  priority: 86,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const spans: DetectionSpan[] = [];

    // Dashed format: 123-456-78-90
    NIP_DASHED.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = NIP_DASHED.exec(text)) !== null) {
      const digits = match[0].replace(/-/g, '');
      if (!validateNip(digits)) {
        continue;
      }

      const hasContext = hasNipContext(text, match.index);
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'nip',
        confidence: hasContext ? 0.98 : 0.92,
        original: match[0],
        detectorId: 'nip',
        metadata: { checksumValid: true },
      });
    }

    // Compact format: 1234567890 (only with context — bare 10 digits are too ambiguous)
    NIP_COMPACT.lastIndex = 0;
    while ((match = NIP_COMPACT.exec(text)) !== null) {
      const digits = match[0];

      // Skip if overlaps with already-found span
      const overlaps = spans.some(
        (s) => match.index < s.end && match.index + match[0].length > s.start,
      );
      if (overlaps) {
        continue;
      }

      if (!validateNip(digits)) {
        continue;
      }

      // Compact 10-digit only accepted with context (too many false positives otherwise)
      const hasContext = hasNipContext(text, match.index);
      if (!hasContext) {
        continue;
      }

      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'nip',
        confidence: 0.95,
        original: match[0],
        detectorId: 'nip',
        metadata: { checksumValid: true },
      });
    }

    return spans;
  },
};
