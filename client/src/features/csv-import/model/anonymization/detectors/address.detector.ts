import type { DetectionSpan, DictionarySet, PiiDetector } from '../types';

// Polish street patterns: ul./al./os./pl. + 1-4 words + number
// Covers: "ul. Tadeusza Kościuszki 43", "al. Jerozolimskie 42/5"
const ADDRESS_PATTERN =
  /\b(ul\.|al\.|os\.|pl\.|ulica|aleja|osiedle|plac)\s+(?:[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż]+[\s.]?){1,4}\s*\d{1,4}[A-Za-z]?(?:\/\d{1,4})?\b/gi;

// Postal code + city: "00-123 Bielsko-Biała"
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
      // Skip if overlaps with an already-found street pattern
      const overlaps = spans.some(
        (s) => match.index < s.end && match.index + match[0].length > s.start,
      );
      if (!overlaps) {
        spans.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'address',
          confidence: 0.82,
          original: match[0],
          detectorId: 'address',
        });
      }
    }

    return spans;
  },
};
