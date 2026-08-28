import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';

export interface GateResult {
  readonly accepted: readonly DetectionSpan[];
  readonly belowThreshold: readonly DetectionSpan[];
}
