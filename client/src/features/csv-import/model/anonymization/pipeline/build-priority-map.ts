import type { PiiDetector } from '#features/csv-import/model/anonymization/types';

export const buildPriorityMap = (
  detectors: readonly PiiDetector[],
): ReadonlyMap<string, number> => {
  const entries = detectors.map((d) => [d.id, d.priority] as const);
  const ids = entries.map(([id]) => id);
  const duplicateId = ids.find((id, i) => ids.indexOf(id) !== i);

  if (duplicateId !== undefined) {
    throw new Error(
      `Duplicate detector id: '${duplicateId}'. Each detector must have a unique id.`,
    );
  }

  return new Map(entries);
};
