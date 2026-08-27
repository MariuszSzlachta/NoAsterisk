import type { DetectionSpan, DictionarySet, PiiDetector } from '#features/csv-import/model/anonymization/types';
import { WITH_CONTEXT_CONFIDENCE, WITHOUT_CONTEXT_CONFIDENCE } from './constants';
import { createNationalIdPattern } from './patterns';
import { hasIdContext, validateNationalId } from './validators';

export const nationalIdDetector: PiiDetector = {
  id: 'national_id',
  priority: 84,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    return Array.from(text.matchAll(createNationalIdPattern()))
      .filter((match) => {
        const letters = match[1] ?? '';
        const digits = match[2] ?? '';
        const hasContext = hasIdContext(text, match.index);
        return hasContext || validateNationalId(letters, digits);
      })
      .map((match) => {
        const letters = match[1] ?? '';
        const digits = match[2] ?? '';
        const hasContext = hasIdContext(text, match.index);
        const confidence = hasContext ? WITH_CONTEXT_CONFIDENCE : WITHOUT_CONTEXT_CONFIDENCE;

        return {
          start: match.index,
          end: match.index + match[0].length,
          type: 'national_id' as const,
          confidence,
          original: match[0],
          detectorId: 'national_id',
          metadata: { hasContext },
        };
      });
  },
};
