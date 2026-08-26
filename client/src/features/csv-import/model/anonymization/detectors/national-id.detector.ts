import type { DetectionSpan, DictionarySet, PiiDetector } from '../types';

// Example: ABS 847291, ABS847291
const NATIONAL_ID_PATTERN = /\b([A-Z]{3})\s?(\d{6})\b/g;

// Context keywords
const ID_CONTEXT = [
  'dowód',
  'dowodu',
  'nr dowodu',
  'dowód osobisty',
  'seria i nr',
  'dokument',
  'tożsamości',
  'id card',
];

// National ID checksum weights: 7,3,1,0,7,3,1,7,3
const ID_WEIGHTS = [7, 3, 1, 0, 7, 3, 1, 7, 3];

/**
 * Validate Polish national ID checksum.
 * Letters are converted: A=10, B=11, ..., Z=35
 * Weight sequence: 7,3,1 for letters, skip position 3 (check digit), 7,3,1,7,3 for digits
 */
const validateNationalId = (letters: string, digits: string): boolean => {
  if (letters.length !== 3 || digits.length !== 6) {
    return false;
  }

  const values: number[] = [];
  // Letters → numeric (A=10, B=11, ..., Z=35)
  for (const ch of letters) {
    values.push(ch.charCodeAt(0) - 55);
  }
  // Digits
  for (const ch of digits) {
    values.push(parseInt(ch, 10));
  }

  // Position 3 (index 3) is the check digit — sum of all other positions mod 10
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const v = values[i];
    const w = ID_WEIGHTS[i];
    if (v === undefined || w === undefined) {
      return false;
    }
    if (i === 3) {
      continue; // skip check digit position in sum
    }
    sum += v * w;
  }

  const checkValue = values[3];
  return checkValue !== undefined && sum % 10 === checkValue;
};

const hasIdContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 30), start).toLowerCase();
  return ID_CONTEXT.some((kw) => prefix.includes(kw));
};

export const nationalIdDetector: PiiDetector = {
  id: 'national_id',
  priority: 84,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const spans: DetectionSpan[] = [];
    NATIONAL_ID_PATTERN.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = NATIONAL_ID_PATTERN.exec(text)) !== null) {
      const letters = match[1] ?? '';
      const digits = match[2] ?? '';

      const hasContext = hasIdContext(text, match.index);

      // Without context, require checksum validation to reduce false positives
      if (!hasContext && !validateNationalId(letters, digits)) {
        continue;
      }

      const confidence = hasContext ? 0.95 : 0.80;

      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'national_id',
        confidence,
        original: match[0],
        detectorId: 'national_id',
        metadata: { hasContext },
      });
    }

    return spans;
  },
};
