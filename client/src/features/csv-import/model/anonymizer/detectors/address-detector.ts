import type { DetectionSpan, DictionarySet, PiiDetector } from '../../types';

// Polish street patterns: ul./al./os./pl. + name + number
const ADDRESS_PATTERN = /\b(ul\.|al\.|os\.|pl\.|ulica|aleja|osiedle|plac)\s+[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż.\s]{2,30}\s+\d{1,4}[A-Za-z]?(?:\/\d{1,4})?\b/gi;

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

    return spans;
  },
};
