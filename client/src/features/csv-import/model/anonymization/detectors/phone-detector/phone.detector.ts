import type { DetectionSpan, DictionarySet, PiiDetector } from '#features/csv-import/model/anonymization/types';
import {
  BARE_CONFIDENCE,
  CONTEXT_CONFIDENCE,
  PL_MOBILE_PREFIXES,
  PLUS_PREFIX_CONFIDENCE,
} from './constants';
import {
  createIntPhonePattern,
  createNoSpacePrefixPattern,
  createPlPhonePattern,
} from './patterns';
import { hasPhoneContext, isLikelyNotPhone } from './validators';

export const phoneDetector: PiiDetector = {
  id: 'phone',
  priority: 85,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
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
          const hasPlus =
            original.startsWith('+') || original.startsWith('(');
          if (hasPlus) {
            return true;
          }
          const digits = original.replace(/\D/g, '');
          const firstDigit = digits[0];
          return (
            firstDigit !== undefined &&
            (PL_MOBILE_PREFIXES as readonly string[]).includes(firstDigit)
          );
        })
        .map((match): DetectionSpan => {
          const original = match[0];
          const start = match.index;
          const hasPlus =
            original.startsWith('+') || original.startsWith('(');
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
            detectorId: 'phone',
          };
        }),
    );

    const sorted = spans.toSorted((a, b) => a.start - b.start);
    return sorted.reduce<readonly DetectionSpan[]>((unique, span) => {
      if (!unique.some((u) => span.start < u.end && span.end > u.start)) {
        return [...unique, span];
      }
      return unique;
    }, []);
  },
};
