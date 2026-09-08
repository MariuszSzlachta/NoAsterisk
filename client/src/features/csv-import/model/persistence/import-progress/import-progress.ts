import { IMPORT_PROGRESS_STATUS } from '#features/csv-import/model/persistence/import-progress-status';

export interface ImportProgress {
  readonly totalRows: number;
  readonly savedRows: number;
  readonly duplicatesSkipped: number;
  readonly rejectedRows: ReadonlyArray<{
    readonly rowIndex: number;
    readonly reason: string;
  }>;
  readonly errors: ReadonlyArray<string>;
  readonly status: (typeof IMPORT_PROGRESS_STATUS)[keyof typeof IMPORT_PROGRESS_STATUS];
}
