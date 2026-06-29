import type { DetectionSpan, DictionarySet, PiiDetector } from '../../types';

// Matches IBAN: 2 letters + 2 check digits + 4-30 alphanumeric (with optional spaces)
const IBAN_PATTERN = /\b([A-Z]{2})\s?(\d{2})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})\b/g;
// Also match compact form without spaces
const IBAN_COMPACT = /\b([A-Z]{2})(\d{26})\b/g;

/**
 * Validate IBAN via mod97 algorithm (ISO 7064).
 */
const validateMod97 = (iban: string): boolean => {
  const cleaned = iban.replace(/\s/g, '');
  if (cleaned.length < 15 || cleaned.length > 34) return false;

  // Move first 4 chars to end, convert letters to numbers (A=10, B=11, ...)
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numericStr = rearranged
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0);
      return code >= 65 && code <= 90 ? String(code - 55) : c;
    })
    .join('');

  // Compute mod97 on large number (process in chunks to avoid overflow)
  let remainder = 0;
  for (let i = 0; i < numericStr.length; i += 7) {
    const chunk = String(remainder) + numericStr.slice(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }

  return remainder === 1;
};

export const ibanDetector: PiiDetector = {
  id: 'iban',
  priority: 90,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const spans: DetectionSpan[] = [];

    for (const pattern of [IBAN_PATTERN, IBAN_COMPACT]) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const original = match[0];
        const cleaned = original.replace(/\s/g, '');
        const valid = validateMod97(cleaned);

        if (valid) {
          spans.push({
            start: match.index,
            end: match.index + original.length,
            type: 'iban',
            confidence: 0.99,
            original,
            detectorId: 'iban',
            metadata: { checksumValid: true },
          });
        }
      }
    }

    // Deduplicate overlapping spans (both patterns may match same IBAN)
    const unique: DetectionSpan[] = [];
    for (const span of spans.sort((a, b) => a.start - b.start)) {
      if (!unique.some((u) => span.start < u.end && span.end > u.start)) {
        unique.push(span);
      }
    }

    return unique;
  },
};
