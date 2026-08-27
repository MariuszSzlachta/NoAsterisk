import type { DetectionSpan, DictionarySet, PiiDetector } from '#features/csv-import/model/anonymization/types';
import {
  GENERIC_EMAIL_CONFIDENCE,
  PERSONAL_EMAIL_CONFIDENCE,
  PERSONAL_LOCAL_MIN_LENGTH,
} from './constants';
import { createEmailPattern } from './patterns';

export const emailDetector: PiiDetector = {
  id: 'email',
  priority: 70,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    return Array.from(text.matchAll(createEmailPattern()), (match) => {
      const email = match[0];
      const [local = ''] = email.split('@');
      const looksPersonal =
        local.includes('.') || local.length > PERSONAL_LOCAL_MIN_LENGTH;

      return {
        start: match.index ?? 0,
        end: (match.index ?? 0) + email.length,
        type: 'email' as const,
        confidence: looksPersonal
          ? PERSONAL_EMAIL_CONFIDENCE
          : GENERIC_EMAIL_CONFIDENCE,
        original: email,
        detectorId: 'email',
      };
    });
  },
};
