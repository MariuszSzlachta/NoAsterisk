import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { PiiDetector } from '#features/csv-import/model/anonymization/types/pii-detector';
import { WITH_CONTEXT_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants/with-context-confidence';
import { WITHOUT_CONTEXT_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants/without-context-confidence';
import { NATIONAL_ID_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants/national-id-detector-id';
import { NATIONAL_ID_PRIORITY } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants/national-id-priority';
import { createNationalIdPattern } from '#features/csv-import/model/anonymization/detectors/national-id-detector/create-national-id-pattern';
import { hasIdContext } from '#features/csv-import/model/anonymization/detectors/national-id-detector/has-id-context';
import { validateNationalId } from '#features/csv-import/model/anonymization/detectors/national-id-detector/validate-national-id';

export const nationalIdDetector: PiiDetector = {
  id: NATIONAL_ID_DETECTOR_ID,
  priority: NATIONAL_ID_PRIORITY,

  detect(text: string): readonly DetectionSpan[] {
    return Array.from(text.matchAll(createNationalIdPattern()))
      .filter((match) => {
        const letters = match[1] ?? '';
        const digits = match[2] ?? '';
        const hasContext = hasIdContext(text, match.index);
        return hasContext || validateNationalId(letters, digits);
      })
      .map((match) => {
        const hasContext = hasIdContext(text, match.index);
        const confidence = hasContext
          ? WITH_CONTEXT_CONFIDENCE
          : WITHOUT_CONTEXT_CONFIDENCE;

        return {
          start: match.index,
          end: match.index + match[0].length,
          type: 'national_id',
          confidence,
          original: match[0],
          detectorId: NATIONAL_ID_DETECTOR_ID,
          metadata: { hasContext },
        };
      });
  },
};
