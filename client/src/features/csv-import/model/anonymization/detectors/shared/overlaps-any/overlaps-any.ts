import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';

export const overlapsAny = (
  spans: readonly DetectionSpan[],
  start: number,
  end: number,
): boolean => spans.some((s) => start < s.end && end > s.start);
