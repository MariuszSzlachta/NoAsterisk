import type { DetectionSpan, DictionarySet, PiiDetector } from '../../types';

// Standard email pattern — deliberately conservative to avoid false positives on domains
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

export const emailDetector: PiiDetector = {
  id: 'email',
  priority: 88,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const spans: DetectionSpan[] = [];
    EMAIL_PATTERN.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = EMAIL_PATTERN.exec(text)) !== null) {
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'email',
        confidence: 0.97,
        original: match[0],
        detectorId: 'email',
      });
    }

    return spans;
  },
};
