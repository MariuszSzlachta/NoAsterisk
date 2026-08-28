import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';

export const overlapsExisting = (
  span: DetectionSpan,
  resolved: readonly DetectionSpan[],
): boolean =>
  resolved.some(
    (existing) => span.start < existing.end && span.end > existing.start,
  );
