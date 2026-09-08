import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';

export interface ImportHistoryDeleteDialogProps {
  readonly record: ImportHistoryRecord;
  readonly isDeleting: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => Promise<void>;
}
