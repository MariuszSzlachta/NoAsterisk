import type { DetectionSpan, DictionarySet, PiiDetector } from '#features/csv-import/model/anonymization/types';
import { BIRTH_DATE_CONFIDENCE } from './constants';
import { createBirthDatePattern } from './patterns';

export const birthDateDetector: PiiDetector = {
  id: 'birth_date',
  priority: 60,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    return Array.from(text.matchAll(createBirthDatePattern()), (match) => ({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      type: 'birth_date' as const,
      confidence: BIRTH_DATE_CONFIDENCE,
      original: match[0],
      detectorId: 'birth_date',
    }));
  },
};
