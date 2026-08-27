import type { DetectionSpan, DictionarySet, PiiDetector } from '#features/csv-import/model/anonymization/types';
import { overlapsAny } from '#features/csv-import/model/anonymization/detectors/shared/overlap';
import {
  COMPACT_CARD_CONFIDENCE,
  FULL_CARD_CONFIDENCE,
  MASKED_CARD_CONFIDENCE,
} from './constants';
import {
  BIN_LAST4,
  COMPACT_CARD,
  DOTTED_CARD,
  FULL_CARD,
  MASKED_CARD_SPACED,
  SHORT_MASKED,
} from './patterns';
import { hasCardPrefix, validateLuhn } from './validators';

export const cardDetector: PiiDetector = {
  id: 'card',
  priority: 88,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const fullSpans: readonly DetectionSpan[] = Array.from(
      text.matchAll(FULL_CARD()),
    )
      .filter((m) => {
        const digits = m[0].replace(/[\s-]/g, '');
        return hasCardPrefix(digits) && validateLuhn(digits);
      })
      .map((m) => ({
        start: m.index ?? 0,
        end: (m.index ?? 0) + m[0].length,
        type: 'card' as const,
        confidence: FULL_CARD_CONFIDENCE,
        original: m[0],
        detectorId: 'card',
        metadata: { checksumValid: true, format: 'full' },
      }));

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
      .map((m) => ({
        start: m.index ?? 0,
        end: (m.index ?? 0) + m[0].length,
        type: 'card' as const,
        confidence: COMPACT_CARD_CONFIDENCE,
        original: m[0],
        detectorId: 'card',
        metadata: { checksumValid: true, format: 'compact' },
      }));

    const validatedSpans = [...fullSpans, ...compactSpans];

    // Longer patterns first to prevent shorter ones from eating their tails
    const maskedSpans = [MASKED_CARD_SPACED, BIN_LAST4, DOTTED_CARD, SHORT_MASKED]
      .reduce<readonly DetectionSpan[]>((acc, factory) => {
        const newSpans = Array.from(text.matchAll(factory()))
          .filter((m) => {
            const start = m.index ?? 0;
            const end = start + m[0].length;
            return (
              !overlapsAny(validatedSpans, start, end) &&
              !overlapsAny(acc, start, end)
            );
          })
          .map((m) => ({
            start: m.index ?? 0,
            end: (m.index ?? 0) + m[0].length,
            type: 'card' as const,
            confidence: MASKED_CARD_CONFIDENCE,
            original: m[0],
            detectorId: 'card',
            metadata: { format: 'masked' },
          }));
        return [...acc, ...newSpans];
      }, []);

    return [...validatedSpans, ...maskedSpans];
  },
};
