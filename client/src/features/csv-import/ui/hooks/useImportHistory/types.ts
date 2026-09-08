import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';

export interface UseImportHistoryResult {
  readonly history: ReadonlyArray<ImportHistoryRecord>;
  readonly pendingDelete: ImportHistoryRecord | undefined;
  readonly isDeleting: boolean;
  readonly error: string | undefined;
  readonly requestDelete: (record: ImportHistoryRecord) => void;
  readonly cancelDelete: () => void;
  readonly confirmDelete: () => Promise<void>;
}
