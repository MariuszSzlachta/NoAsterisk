import type { AnonymizationStatus } from '#features/csv-import/model/anonymization/types/anonymization-status';

export interface AnonymizationSubmitEntry {
  readonly rowIndex: number;
  readonly anonymizedTitle: string;
  readonly status: AnonymizationStatus;
  readonly accepted: boolean;
}
