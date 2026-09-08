import { useRef, useState } from 'react';

import { useRulesStore } from '#features/admin-rules';
import {
  categorizeImportedTransactions,
  IMPORT_PROGRESS_STATUS,
  INITIAL_IMPORT_PROGRESS,
  prepareImportedTransactions,
  saveImportedBatch,
  selectAcceptedImportRows,
} from '#features/csv-import/model/persistence';
import { IMPORT_HISTORY_UNKNOWN_FILENAME } from '#features/csv-import/model/persistence/save-import-history-record/constants/unknown-file-name';
import type { ImportProgress } from '#features/csv-import/model/types';
import { useImportHistoryStore } from '#features/csv-import/store/useImportHistoryStore';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import { LOCAL_IMPORT_FAILED } from '#features/csv-import/ui/hooks/useImportSubmit/constants/local-import-failed';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';

interface UseImportSubmitResult {
  readonly progress: ImportProgress;
  readonly handleSubmit: () => Promise<void>;
  readonly canSubmit: boolean;
  readonly importableCount: number;
}

export const useImportSubmit = (): UseImportSubmitResult => {
  const rows = useImportWizardStore((state) => state.rows);
  const entries = useImportWizardStore((state) => state.anonymizationEntries);
  const batchId = useImportWizardStore((state) => state.batchId);
  const isWizardSubmitting = useImportWizardStore(
    (state) => state.isSubmitting,
  );
  const setSubmitting = useImportWizardStore((state) => state.setSubmitting);
  const setSubmitError = useImportWizardStore((state) => state.setSubmitError);
  const submissionInFlight = useRef(false);
  const [progress, setProgress] = useState<ImportProgress>(
    INITIAL_IMPORT_PROGRESS,
  );

  const acceptedRows = selectAcceptedImportRows(rows, entries);
  const importableCount = acceptedRows.length;
  const canSubmit =
    importableCount > 0 &&
    !isWizardSubmitting &&
    !submissionInFlight.current &&
    progress.status !== IMPORT_PROGRESS_STATUS.completed;

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit || submissionInFlight.current) {
      return;
    }

    submissionInFlight.current = true;
    setSubmitting(true);
    setSubmitError(undefined);
    setProgress({
      ...INITIAL_IMPORT_PROGRESS,
      totalRows: importableCount,
      status: IMPORT_PROGRESS_STATUS.submitting,
    });

    const stableBatchId = batchId ?? crypto.randomUUID();
    if (batchId === undefined) {
      useImportWizardStore.setState({ batchId: stableBatchId });
    }
    const completedAt = new Date().toISOString();

    try {
      const prepared = await prepareImportedTransactions(
        rows,
        entries,
        stableBatchId,
        completedAt,
      );
      const categorized = categorizeImportedTransactions(
        prepared.records,
        useRulesStore.getState().rules,
      );
      const result = await saveImportedBatch(categorized, {
        batchId: stableBatchId,
        fileName:
          useImportWizardStore.getState().file?.name ??
          IMPORT_HISTORY_UNKNOWN_FILENAME,
        completedAt,
        rejectedCount: prepared.rejectedRows.length,
      });
      const historyRecord = result.historyRecord;

      useTransactionsStore.setState((state) => ({
        transactions: [...state.transactions, ...result.written],
      }));
      useImportHistoryStore.getState().addRecord(historyRecord);
      setProgress({
        totalRows: importableCount,
        savedRows: result.written.length,
        duplicatesSkipped: result.duplicatesSkipped,
        rejectedRows: prepared.rejectedRows,
        errors: [],
        status: IMPORT_PROGRESS_STATUS.completed,
      });
      useImportWizardStore.getState().reset();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : LOCAL_IMPORT_FAILED;
      setSubmitError(message);
      setProgress((current) => ({
        ...current,
        errors: [message],
        status: IMPORT_PROGRESS_STATUS.failed,
      }));
    } finally {
      setSubmitting(false);
      submissionInFlight.current = false;
    }
  };

  return { progress, handleSubmit, canSubmit, importableCount };
};
