import type { DetectionSpan } from '#features/csv-import/model/anonymization/types';

import { MASK_STRATEGIES } from './strategies';
import { validateSpanInvariants } from './validate-spans';

/**
 * Mask a single detected PII span using type-specific strategy.
 */
export const maskSpan = (span: DetectionSpan): string => {
  const strategy = MASK_STRATEGIES[span.type];
  return strategy(span.original);
};

/**
 * Apply masking to all resolved spans in a text string.
 * Validates that spans are sorted and non-overlapping before proceeding.
 */
export const applyMasking = (
  text: string,
  spans: readonly DetectionSpan[],
): string => {
  if (spans.length === 0) {
    return text;
  }

  validateSpanInvariants(spans, text.length);

  const { masked, lastEnd } = spans.reduce(
    (acc, span) => ({
      masked: acc.masked + text.slice(acc.lastEnd, span.start) + maskSpan(span),
      lastEnd: span.end,
    }),
    { masked: '', lastEnd: 0 },
  );

  return masked + text.slice(lastEnd);
};
