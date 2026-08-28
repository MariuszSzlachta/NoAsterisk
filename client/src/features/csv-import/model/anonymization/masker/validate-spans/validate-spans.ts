import type { DetectionSpan } from '#features/csv-import/model/anonymization/types';

/**
 * Validate that spans are sorted by position, non-overlapping, and within text bounds.
 * Throws descriptive error on first violation.
 */
export const validateSpanInvariants = (
  spans: readonly DetectionSpan[],
  textLength: number,
): void => {
  spans.forEach((span, i) => {
    if (span.start < 0 || span.end > textLength || span.start >= span.end) {
      throw new Error(
        `[pii.masker] Span out of bounds at index ${i}: [${span.start}, ${span.end}) in text of length ${textLength}`,
      );
    }

    if (i > 0) {
      const prev = spans[i - 1]!;
      if (span.start < prev.end) {
        throw new Error(
          `[pii.masker] Overlapping spans at index ${i}: prev.end=${prev.end}, current.start=${span.start}`,
        );
      }
    }
  });
};
