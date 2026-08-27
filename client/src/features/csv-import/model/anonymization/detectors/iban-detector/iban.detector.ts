import type { DetectionSpan, DictionarySet, PiiDetector } from '#features/csv-import/model/anonymization/types';
import { overlapsAny } from '#features/csv-import/model/anonymization/detectors/shared/overlap';
import { BARE_PL_CONFIDENCE, FULL_IBAN_CONFIDENCE } from './constants';
import {
  BARE_PL_COMPACT,
  BARE_PL_IBAN,
  IBAN_COMPACT,
  IBAN_PATTERN,
} from './patterns';
import { validateBarePl, validateMod97 } from './validators';

export const ibanDetector: PiiDetector = {
  id: 'iban',
  priority: 90,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const fullSpans = [IBAN_PATTERN, IBAN_COMPACT].flatMap((factory) =>
      Array.from(text.matchAll(factory()))
        .filter((m) => validateMod97(m[0].replace(/\s/g, '')))
        .map((m) => ({
          start: m.index ?? 0,
          end: (m.index ?? 0) + m[0].length,
          type: 'iban' as const,
          confidence: FULL_IBAN_CONFIDENCE,
          original: m[0],
          detectorId: 'iban',
          metadata: { checksumValid: true, format: 'full' },
        })),
    );

    const bareSpans = [BARE_PL_IBAN, BARE_PL_COMPACT].flatMap((factory) =>
      Array.from(text.matchAll(factory()))
        .filter((m) => {
          const start = m.index ?? 0;
          const end = start + m[0].length;
          if (overlapsAny(fullSpans, start, end)) {
            return false;
          }
          const digits = m[0].replace(/^'/, '').replace(/\s/g, '');
          return validateBarePl(digits);
        })
        .map((m) => ({
          start: m.index ?? 0,
          end: (m.index ?? 0) + m[0].length,
          type: 'iban' as const,
          confidence: BARE_PL_CONFIDENCE,
          original: m[0],
          detectorId: 'iban',
          metadata: { checksumValid: true, format: 'bare_pl' },
        })),
    );

    const allSpans = [...fullSpans, ...bareSpans];
    const sorted = allSpans.toSorted((a, b) => a.start - b.start);

    return sorted.reduce<readonly DetectionSpan[]>((unique, span) => {
      if (!unique.some((u) => span.start < u.end && span.end > u.start)) {
        return [...unique, span];
      }
      return unique;
    }, []);
  },
};
