import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import { maskSpan } from '#features/csv-import/model/anonymization/masker/mask-span';
import { validateSpanInvariants } from '#features/csv-import/model/anonymization/masker/validate-spans';

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
