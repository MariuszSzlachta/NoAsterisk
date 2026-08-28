import { REVIEW_THRESHOLD } from '#features/csv-import/model/anonymization/pipeline/constants/review-threshold';
import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { GateResult } from '#features/csv-import/model/anonymization/pipeline/steps/gate-result';

export const applyConfidenceGate = (
  spans: readonly DetectionSpan[],
): GateResult => ({
  accepted: spans.filter((s) => s.confidence >= REVIEW_THRESHOLD),
  belowThreshold: spans.filter((s) => s.confidence < REVIEW_THRESHOLD),
});
