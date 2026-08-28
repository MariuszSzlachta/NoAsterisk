import { AUTO_ACCEPT_THRESHOLD } from '#features/csv-import/model/anonymization/pipeline/constants/auto-accept-threshold';
import type { AnonymizationStatus } from '#features/csv-import/model/anonymization/types/anonymization-status';
import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';

export const determineStatus = (
  spans: readonly DetectionSpan[],
  hasBelowThreshold: boolean,
): AnonymizationStatus => {
  if (hasBelowThreshold) {
    return 'needs_review';
  }
  if (spans.length === 0) {
    return 'safe';
  }
  if (spans.every((s) => s.confidence >= AUTO_ACCEPT_THRESHOLD)) {
    return 'anonymized';
  }
  return 'needs_review';
};
