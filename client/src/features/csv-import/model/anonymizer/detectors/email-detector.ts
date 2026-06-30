import type { DetectionSpan, DictionarySet, PiiDetector } from '../../types';

// Standard email pattern — deliberately conservative to avoid false positives on domains
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

export const emailDetector: PiiDetector = {
  id: 'email',
  priority: 70,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const spans: DetectionSpan[] = [];
    EMAIL_PATTERN.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = EMAIL_PATTERN.exec(text)) !== null) {
      const email = match[0];
      const [local] = email.split('@');

      // Personal emails (jan.kowalski@, longer local parts) = higher confidence
      // Short/generic (info@, admin@) = lower — may be business contact user wants to keep
      const looksPersonal = local.includes('.') || local.length > 8;
      const confidence = looksPersonal ? 0.97 : 0.82;

      spans.push({
        start: match.index,
        end: match.index + email.length,
        type: 'email',
        confidence,
        original: email,
        detectorId: 'email',
      });
    }

    return spans;
  },
};
