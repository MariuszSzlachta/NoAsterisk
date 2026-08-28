import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { AnonymizationStatus } from '#features/csv-import/model/anonymization/types/anonymization-status';

export interface AnonymizationEntry {
  readonly rowIndex: number;
  readonly originalTitle: string;
  readonly anonymizedTitle: string;
  readonly spans: readonly DetectionSpan[];
  readonly status: AnonymizationStatus;
  readonly accepted: boolean;
}
