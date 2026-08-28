import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { PiiDetector } from '#features/csv-import/model/anonymization/types/pii-detector';
import { GENERIC_EMAIL_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/email-detector/constants/generic-email-confidence';
import { PERSONAL_EMAIL_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/email-detector/constants/personal-email-confidence';
import { PERSONAL_LOCAL_MIN_LENGTH } from '#features/csv-import/model/anonymization/detectors/email-detector/constants/personal-local-min-length';
import { EMAIL_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/email-detector/constants/email-detector-id';
import { EMAIL_PRIORITY } from '#features/csv-import/model/anonymization/detectors/email-detector/constants/email-priority';
import { EMAIL_AT_SEPARATOR } from '#features/csv-import/model/anonymization/detectors/email-detector/constants/email-at-separator';
import { createEmailPattern } from '#features/csv-import/model/anonymization/detectors/email-detector/create-email-pattern';

export const emailDetector: PiiDetector = {
  id: EMAIL_DETECTOR_ID,
  priority: EMAIL_PRIORITY,

  detect(text: string): readonly DetectionSpan[] {
    return Array.from(text.matchAll(createEmailPattern()), (match) => {
      const email = match[0];
      const [local = ''] = email.split(EMAIL_AT_SEPARATOR);
      const looksPersonal =
        local.includes('.') || local.length > PERSONAL_LOCAL_MIN_LENGTH;

      return {
        start: match.index ?? 0,
        end: (match.index ?? 0) + email.length,
        type: 'email',
        confidence: looksPersonal
          ? PERSONAL_EMAIL_CONFIDENCE
          : GENERIC_EMAIL_CONFIDENCE,
        original: email,
        detectorId: EMAIL_DETECTOR_ID,
      };
    });
  },
};
