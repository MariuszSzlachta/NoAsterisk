import { overlapsAny } from '#features/csv-import/model/anonymization/detectors/shared';
import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { PiiDetector } from '#features/csv-import/model/anonymization/types/pii-detector';
import { BIN_LAST4 } from '#features/csv-import/model/anonymization/detectors/card-detector/bin-last4-pattern';
import { COMPACT_CARD } from '#features/csv-import/model/anonymization/detectors/card-detector/compact-card-pattern';
import { COMPACT_CARD_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/compact-card-confidence';
import { FULL_CARD_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/full-card-confidence';
import { MASKED_CARD_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/masked-card-confidence';
import { CARD_PRIORITY } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/card-priority';
import { CARD_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/card-detector-id';
import { DIGIT_STRIP_PATTERN } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/digit-strip-pattern';
import { DOTTED_CARD } from '#features/csv-import/model/anonymization/detectors/card-detector/dotted-card-pattern';
import { FULL_CARD } from '#features/csv-import/model/anonymization/detectors/card-detector/full-card-pattern';
import { hasCardPrefix } from '#features/csv-import/model/anonymization/detectors/card-detector/has-card-prefix';
import { MASKED_CARD_SPACED } from '#features/csv-import/model/anonymization/detectors/card-detector/masked-card-spaced-pattern';
import { SHORT_MASKED } from '#features/csv-import/model/anonymization/detectors/card-detector/short-masked-pattern';
import { validateLuhn } from '#features/csv-import/model/anonymization/detectors/card-detector/validate-luhn';
import { toCardSpan } from '#features/csv-import/model/anonymization/detectors/card-detector/to-card-span';

export const cardDetector: PiiDetector = {
  id: CARD_DETECTOR_ID,
  priority: CARD_PRIORITY,

  detect(text: string): readonly DetectionSpan[] {
    const fullSpans: readonly DetectionSpan[] = Array.from(
      text.matchAll(FULL_CARD()),
    )
      .filter((m) => {
        const digits = m[0].replace(DIGIT_STRIP_PATTERN, '');
        return hasCardPrefix(digits) && validateLuhn(digits);
      })
      .map((m) => toCardSpan(m, FULL_CARD_CONFIDENCE, { checksumValid: true, format: 'full' }));

    const compactSpans: readonly DetectionSpan[] = Array.from(
      text.matchAll(COMPACT_CARD()),
    )
      .filter((m) => {
        const start = m.index ?? 0;
        const end = start + m[0].length;
        return (
          !overlapsAny(fullSpans, start, end) &&
          hasCardPrefix(m[0]) &&
          validateLuhn(m[0])
        );
      })
      .map((m) => toCardSpan(m, COMPACT_CARD_CONFIDENCE, { checksumValid: true, format: 'compact' }));

    const validatedSpans = [...fullSpans, ...compactSpans];

    // Longer patterns first to prevent shorter ones from consuming their tails
    const maskedPatterns = [MASKED_CARD_SPACED, BIN_LAST4, DOTTED_CARD, SHORT_MASKED];
    const maskedSpans = maskedPatterns.reduce<readonly DetectionSpan[]>((acc, factory) =>
      [
        ...acc,
        ...Array.from(text.matchAll(factory()))
          .filter((m) => {
            const start = m.index ?? 0;
            const end = start + m[0].length;
            return !overlapsAny(validatedSpans, start, end) && !overlapsAny(acc, start, end);
          })
          .map((m) => toCardSpan(m, MASKED_CARD_CONFIDENCE, { format: 'masked' })),
      ], []);

    return [...validatedSpans, ...maskedSpans];
  },
};
