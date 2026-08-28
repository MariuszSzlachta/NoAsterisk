import type { AnonymizationStatus } from '#features/csv-import/model/types';

export interface AnonymizationGridRow {
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly amount: number;
  readonly currency: string;
  readonly balance?: number;
  readonly category?: string;
  readonly anonymizationStatus: AnonymizationStatus;
  readonly rowIndex: number;
}
