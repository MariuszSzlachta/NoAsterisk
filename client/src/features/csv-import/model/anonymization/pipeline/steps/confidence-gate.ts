import type { DetectionSpan } from '#features/csv-import/model/anonymization/types';
import { REVIEW_THRESHOLD } from '#features/csv-import/model/anonymization/pipeline/constants';

export interface GateResult {
  readonly accepted: readonly DetectionSpan[];
  readonly belowThreshold: readonly DetectionSpan[];
}

/**
 * Architecture doc § 4 step 5: separate spans by confidence threshold.
 * Below-threshold spans are NOT discarded — they force needs_review status.
 */
export const applyConfidenceGate = (
  spans: readonly DetectionSpan[],
): GateResult => ({
  accepted: spans.filter((s) => s.confidence >= REVIEW_THRESHOLD),
  belowThreshold: spans.filter((s) => s.confidence < REVIEW_THRESHOLD),
});
