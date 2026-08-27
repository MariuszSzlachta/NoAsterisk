import { AUTO_ACCEPT_THRESHOLD } from '#features/csv-import/model/anonymization/pipeline/constants';
import type {
  AnonymizationStatus,
  DetectionSpan,
} from '#features/csv-import/model/anonymization/types';

/**
 * Determine anonymization status from resolved spans and below-threshold presence.
 *
 * - Any below-threshold detections → needs_review (uncertain PII detected)
 * - No spans at all → safe
 * - All spans ≥ AUTO_ACCEPT_THRESHOLD → anonymized (high confidence, auto-accepted)
 * - Otherwise → needs_review (some spans below auto-accept)
 */
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
