import type { ImportProgress } from '#features/csv-import/model/persistence/import-progress';
import { IMPORT_PROGRESS_STATUS } from '#features/csv-import/model/persistence/import-progress-status';

export const INITIAL_IMPORT_PROGRESS: ImportProgress = {
  totalRows: 0,
  savedRows: 0,
  duplicatesSkipped: 0,
  rejectedRows: [],
  errors: [],
  status: IMPORT_PROGRESS_STATUS.idle,
};
