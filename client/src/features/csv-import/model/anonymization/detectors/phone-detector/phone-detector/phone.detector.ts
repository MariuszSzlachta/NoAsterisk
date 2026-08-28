import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { PiiDetector } from '#features/csv-import/model/anonymization/types/pii-detector';
import { BARE_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/phone-detector/constants/bare-confidence';
import { CONTEXT_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/phone-detector/constants/context-confidence';
import { PL_MOBILE_PREFIXES } from '#features/csv-import/model/anonymization/detectors/phone-detector/constants/pl-mobile-prefixes';
import { PLUS_PREFIX_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/phone-detector/constants/plus-prefix-confidence';
import { PHONE_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/phone-detector/constants/phone-detector-id';
import { PHONE_PRIORITY } from '#features/csv-import/model/anonymization/detectors/phone-detector/constants/phone-priority';
import { NON_DIGIT_PATTERN } from '#features/csv-import/model/anonymization/detectors/phone-detector/constants/non-digit-pattern';
import { createIntPhonePattern } from '#features/csv-import/model/anonymization/detectors/phone-detector/create-int-phone-pattern';
import { createNoSpacePrefixPattern } from '#features/csv-import/model/anonymization/detectors/phone-detector/create-no-space-prefix-pattern';
import { createPlPhonePattern } from '#features/csv-import/model/anonymization/detectors/phone-detector/create-pl-phone-pattern';
import { hasPhoneContext } from '#features/csv-import/model/anonymization/detectors/phone-detector/has-phone-context';
import { isLikelyNotPhone } from '#features/csv-import/model/anonymization/detectors/phone-detector/is-likely-not-phone';

export const phoneDetector: PiiDetector = {
  id: PHONE_DETECTOR_ID,
  priority: PHONE_PRIORITY,

  detect(text: string): readonly DetectionSpan[] {
    const patterns = [
      createPlPhonePattern(),
      createIntPhonePattern(),
      createNoSpacePrefixPattern(),
    ];

    const spans = patterns.flatMap((pattern) =>
      Array.from(text.matchAll(pattern))
        .filter((match) => !isLikelyNotPhone(text, match.index))
        .filter((match) => {
          const original = match[0];
          const hasPlus = original.startsWith('+') || original.startsWith('(');
          if (hasPlus) {
            return true;
          }
          const digits = original.replace(NON_DIGIT_PATTERN, '');
          const firstDigit = digits[0];
          return (
            firstDigit !== undefined &&
            PL_MOBILE_PREFIXES.includes(firstDigit)
          );
        })
        .map((match): DetectionSpan => {
          const original = match[0];
          const start = match.index;
          const hasPlus = original.startsWith('+') || original.startsWith('(');
          const hasContext = hasPhoneContext(text, start);

          const confidence = hasPlus
            ? PLUS_PREFIX_CONFIDENCE
            : hasContext
              ? CONTEXT_CONFIDENCE
              : BARE_CONFIDENCE;

          return {
            start,
            end: start + original.length,
            type: 'phone',
            confidence,
            original,
            detectorId: PHONE_DETECTOR_ID,
          };
        }),
    );

    const sorted = spans.toSorted((a, b) => a.start - b.start);
    return sorted.reduce<readonly DetectionSpan[]>((unique, span) => {
      if (unique.some((u) => span.start < u.end && span.end > u.start)) {
        return unique;
      }
      return [...unique, span];
    }, []);
  },
};
