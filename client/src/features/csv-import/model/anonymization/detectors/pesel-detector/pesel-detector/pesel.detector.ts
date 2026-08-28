import type {
  DetectionSpan,
  DictionarySet,
  PiiDetector,
} from '#features/csv-import/model/anonymization/types';

import {
  WITH_CONTEXT_CONFIDENCE,
  WITHOUT_CONTEXT_CONFIDENCE,
} from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants';
import { createPeselPattern } from '#features/csv-import/model/anonymization/detectors/pesel-detector/create-pesel-pattern';
import { hasPeselContext } from '#features/csv-import/model/anonymization/detectors/pesel-detector/has-pesel-context';
import { hasValidBirthDate } from '#features/csv-import/model/anonymization/detectors/pesel-detector/has-valid-birth-date';
import { validatePesel } from '#features/csv-import/model/anonymization/detectors/pesel-detector/validate-pesel';

export const peselDetector: PiiDetector = {
  id: 'pesel',
  priority: 92,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const pattern = createPeselPattern();

    return Array.from(text.matchAll(pattern))
      .map((match) => ({
        match,
        digits: match[1] ?? match[0],
      }))
      .filter(
        ({ digits }) => validatePesel(digits) && hasValidBirthDate(digits),
      )
      .map(({ match }): DetectionSpan => {
        const hasContext = hasPeselContext(text, match.index);
        return {
          start: match.index,
          end: match.index + match[0].length,
          type: 'pesel',
          confidence: hasContext
            ? WITH_CONTEXT_CONFIDENCE
            : WITHOUT_CONTEXT_CONFIDENCE,
          original: match[0],
          detectorId: 'pesel',
          metadata: { checksumValid: true, hasContext },
        };
      });
  },
};
