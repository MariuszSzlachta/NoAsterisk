import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { PiiDetector } from '#features/csv-import/model/anonymization/types/pii-detector';
import { WITH_CONTEXT_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/with-context-confidence';
import { WITHOUT_CONTEXT_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/without-context-confidence';
import { PESEL_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/pesel-detector-id';
import { PESEL_PRIORITY } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/pesel-priority';
import { createPeselPattern } from '#features/csv-import/model/anonymization/detectors/pesel-detector/create-pesel-pattern';
import { hasPeselContext } from '#features/csv-import/model/anonymization/detectors/pesel-detector/has-pesel-context';
import { hasValidBirthDate } from '#features/csv-import/model/anonymization/detectors/pesel-detector/has-valid-birth-date';
import { validatePesel } from '#features/csv-import/model/anonymization/detectors/pesel-detector/validate-pesel';

export const peselDetector: PiiDetector = {
  id: PESEL_DETECTOR_ID,
  priority: PESEL_PRIORITY,

  detect(text: string): readonly DetectionSpan[] {
    return Array.from(text.matchAll(createPeselPattern()))
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
          detectorId: PESEL_DETECTOR_ID,
          metadata: { checksumValid: true, hasContext },
        };
      });
  },
};
