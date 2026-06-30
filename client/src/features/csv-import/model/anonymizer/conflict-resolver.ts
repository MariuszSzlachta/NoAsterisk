import type { DetectionSpan } from '../types';

/**
 * Resolve overlapping detection spans using priority-based strategy.
 *
 * Architecture doc § 4 step 4:
 * - Higher priority detector wins
 * - Same priority: higher confidence wins
 * - Result: non-overlapping set sorted by position
 */
export const resolveConflicts = (
  spans: readonly DetectionSpan[],
  priorityMap: ReadonlyMap<string, number>,
): DetectionSpan[] => {
  const sorted = [...spans].sort((a, b) => {
    const priA = priorityMap.get(a.detectorId) ?? 0;
    const priB = priorityMap.get(b.detectorId) ?? 0;
    const priDiff = priB - priA;
    if (priDiff !== 0) {
      return priDiff;
    }
    return b.confidence - a.confidence;
  });

  const resolved: DetectionSpan[] = [];
  for (const span of sorted) {
    const overlaps = resolved.some(
      (existing) => span.start < existing.end && span.end > existing.start,
    );
    if (!overlaps) {
      resolved.push(span);
    }
  }

  return resolved.sort((a, b) => a.start - b.start);
};
