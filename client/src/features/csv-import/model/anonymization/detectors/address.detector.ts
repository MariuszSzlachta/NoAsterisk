import type { DetectionSpan, DictionarySet, PiiDetector } from '../types';

// Polish street patterns: ul./al./os./pl. + 1-4 words + number
const ADDRESS_PATTERN =
  /\b(ul\.|al\.|os\.|pl\.|ulica|aleja|osiedle|plac)\s+(?:[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż]+[\s.]?){1,4}\s*\d{1,4}[A-Za-z]?(?:\/\d{1,4})?\b/gi;

const POSTAL_CODE_PATTERN =
  /\b\d{2}-\d{3}\s+[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż-]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż-]+)?\b/g;

export const addressDetector: PiiDetector = {
  id: 'address',
  priority: 40,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const spans: DetectionSpan[] = [];

    ADDRESS_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = ADDRESS_PATTERN.exec(text)) !== null) {
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'address',
        confidence: 0.88,
        original: match[0],
        detectorId: 'address',
      });
    }

    POSTAL_CODE_PATTERN.lastIndex = 0;
    while ((match = POSTAL_CODE_PATTERN.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      const matchOriginal = match[0];

      // Skip if overlaps with an already-found street pattern
      const overlaps = spans.some(
        (s) => matchStart < s.end && matchEnd > s.start,
      );
      if (!overlaps) {
        spans.push({
          start: matchStart,
          end: matchEnd,
          type: 'address',
          confidence: 0.82,
          original: matchOriginal,
          detectorId: 'address',
        });
      }
    }

    return spans;
  },
};
