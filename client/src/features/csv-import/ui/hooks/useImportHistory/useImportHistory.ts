import { useRef, useState } from 'react';

import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';
import { deleteImportHistoryBatch } from '#features/csv-import/model/persistence';
import { useImportHistoryStore } from '#features/csv-import/store/useImportHistoryStore';
import { IMPORT_HISTORY_DELETE_FAILED } from '#features/csv-import/ui/hooks/useImportHistory/constants/delete-failed';
import type { UseImportHistoryResult } from '#features/csv-import/ui/hooks/useImportHistory/types';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';

export const useImportHistory = (): UseImportHistoryResult => {
  const history = useImportHistoryStore((state) => state.history);
  const removeRecord = useImportHistoryStore((state) => state.removeRecord);
  const removeTransactionsByBatchId = useTransactionsStore(
    (state) => state.removeTransactionsByBatchId,
  );
  const [pendingDelete, setPendingDelete] = useState<ImportHistoryRecord>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const deletionInFlight = useRef(false);

  const requestDelete = (record: ImportHistoryRecord): void => {
    setError(undefined);
    setPendingDelete(record);
  };

  const cancelDelete = (): void => {
    if (!isDeleting) {
      setPendingDelete(undefined);
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (pendingDelete === undefined || deletionInFlight.current) {
      return;
    }

    deletionInFlight.current = true;
    setIsDeleting(true);
    setError(undefined);

    try {
      await deleteImportHistoryBatch(pendingDelete.batchId);
      removeTransactionsByBatchId(pendingDelete.batchId);
      removeRecord(pendingDelete.batchId);
      setPendingDelete(undefined);
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : IMPORT_HISTORY_DELETE_FAILED,
      );
    } finally {
      deletionInFlight.current = false;
      setIsDeleting(false);
    }
  };

  return {
    history,
    pendingDelete,
    isDeleting,
    error,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
};
