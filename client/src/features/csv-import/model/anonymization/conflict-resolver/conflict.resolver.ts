import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import { DEFAULT_PRIORITY } from '#features/csv-import/model/anonymization/conflict-resolver/constants/default-priority';
import { overlapsExisting } from '#features/csv-import/model/anonymization/conflict-resolver/overlaps-existing';

export const resolveConflicts = (
  spans: readonly DetectionSpan[],
  priorityMap: ReadonlyMap<string, number>,
): DetectionSpan[] =>
  [...spans]
    .sort((a, b) => {
      const priDiff =
        (priorityMap.get(b.detectorId) ?? DEFAULT_PRIORITY) -
        (priorityMap.get(a.detectorId) ?? DEFAULT_PRIORITY);
      if (priDiff !== 0) {
        return priDiff;
      }
      return b.confidence - a.confidence;
    })
    .reduce<DetectionSpan[]>(
      (resolved, span) =>
        overlapsExisting(span, resolved) ? resolved : [...resolved, span],
      [],
    )
    .sort((a, b) => a.start - b.start);
