import type { DetectionSpan, DictionarySet, PiiDetector } from '../types';

// Single consolidated pattern: context keyword + date
// Matches: "ur. 15.03.1992", "urodzona 1992-03-15", "data urodzenia: 15/03/92"
const BIRTH_DATE_PATTERN =
  /\b(ur\.|ur:|data\s+ur\.|dat\.\s*ur\.|urodzony|urodzona|urodzenia|data\s+urodzenia|born|d\.o\.b\.?)\s*:?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/gi;

export const birthDateDetector: PiiDetector = {
  id: 'birth_date',
  priority: 60,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const spans: DetectionSpan[] = [];
    BIRTH_DATE_PATTERN.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = BIRTH_DATE_PATTERN.exec(text)) !== null) {
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'birth_date',
        confidence: 0.94,
        original: match[0],
        detectorId: 'birth_date',
      });
    }

    return spans;
  },
};
