import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { PiiDetector } from '#features/csv-import/model/anonymization/types/pii-detector';
import { BIRTH_DATE_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/birth-date-detector/constants/birth-date-confidence';
import { BIRTH_DATE_PRIORITY } from '#features/csv-import/model/anonymization/detectors/birth-date-detector/constants/birth-date-priority';
import { BIRTH_DATE_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/birth-date-detector/constants/birth-date-detector-id';
import { createBirthDatePattern } from '#features/csv-import/model/anonymization/detectors/birth-date-detector/create-birth-date-pattern';

export const birthDateDetector: PiiDetector = {
  id: BIRTH_DATE_DETECTOR_ID,
  priority: BIRTH_DATE_PRIORITY,

  detect(text: string): readonly DetectionSpan[] {
    return Array.from(text.matchAll(createBirthDatePattern()), (match) => ({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      type: 'birth_date',
      confidence: BIRTH_DATE_CONFIDENCE,
      original: match[0],
      detectorId: BIRTH_DATE_DETECTOR_ID,
    }));
  },
};
