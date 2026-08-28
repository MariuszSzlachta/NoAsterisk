import { overlapsAny } from '#features/csv-import/model/anonymization/detectors/shared';
import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { PiiDetector } from '#features/csv-import/model/anonymization/types/pii-detector';
import { BARE_PL_COMPACT } from '#features/csv-import/model/anonymization/detectors/iban-detector/bare-pl-compact-pattern';
import { BARE_PL_IBAN } from '#features/csv-import/model/anonymization/detectors/iban-detector/bare-pl-iban-pattern';
import { BARE_PL_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/bare-pl-confidence';
import { FULL_IBAN_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/full-iban-confidence';
import { IBAN_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/iban-detector-id';
import { IBAN_PRIORITY } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/iban-priority';
import { WHITESPACE_PATTERN } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/whitespace-pattern';
import { LEADING_QUOTE_PATTERN } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/leading-quote-pattern';
import { IBAN_COMPACT } from '#features/csv-import/model/anonymization/detectors/iban-detector/iban-compact-pattern';
import { IBAN_PATTERN } from '#features/csv-import/model/anonymization/detectors/iban-detector/iban-pattern';
import { validateBarePl } from '#features/csv-import/model/anonymization/detectors/iban-detector/validate-bare-pl';
import { validateMod97 } from '#features/csv-import/model/anonymization/detectors/iban-detector/validate-mod97';
import { toIbanSpan } from '#features/csv-import/model/anonymization/detectors/iban-detector/to-iban-span';

export const ibanDetector: PiiDetector = {
  id: IBAN_DETECTOR_ID,
  priority: IBAN_PRIORITY,

  detect(text: string): readonly DetectionSpan[] {
    const fullSpans = [IBAN_PATTERN, IBAN_COMPACT].flatMap((factory) =>
      Array.from(text.matchAll(factory()))
        .filter((m) => validateMod97(m[0].replace(WHITESPACE_PATTERN, '')))
        .map((m) => toIbanSpan(m, FULL_IBAN_CONFIDENCE, { checksumValid: true, format: 'full' })),
    );

    const bareSpans = [BARE_PL_IBAN, BARE_PL_COMPACT].flatMap((factory) =>
      Array.from(text.matchAll(factory()))
        .filter((m) => {
          const start = m.index ?? 0;
          const end = start + m[0].length;
          if (overlapsAny(fullSpans, start, end)) {
            return false;
          }
          const digits = m[0].replace(LEADING_QUOTE_PATTERN, '').replace(WHITESPACE_PATTERN, '');
          return validateBarePl(digits);
        })
        .map((m) => toIbanSpan(m, BARE_PL_CONFIDENCE, { checksumValid: true, format: 'bare_pl' })),
    );

    const allSpans = [...fullSpans, ...bareSpans];
    const sorted = allSpans.toSorted((a, b) => a.start - b.start);

    return sorted.reduce<readonly DetectionSpan[]>((unique, span) => {
      if (unique.some((u) => span.start < u.end && span.end > u.start)) {
        return unique;
      }
      return [...unique, span];
    }, []);
  },
};
