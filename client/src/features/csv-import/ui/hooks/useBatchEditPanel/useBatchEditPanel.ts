import { findSimilarRows } from '#features/csv-import/model/transformation/find-similar-rows';
import type { TransactionRow } from '#features/csv-import/model/types';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';

interface BatchEditPanelResult {
  readonly isOpen: boolean;
  readonly field: 'title' | 'category' | undefined;
  readonly originalValue: string;
  readonly newValue: string;
  readonly similarRows: ReadonlyArray<TransactionRow>;
  readonly handleCellEdit: (rowId: string, field: string, value: unknown) => void;
  readonly handleApply: () => void;
  readonly handleSkip: () => void;
}

export const useBatchEditPanel = (): BatchEditPanelResult => {
  const rows = useImportWizardStore((s) => s.rows);
  const batchEditPanel = useImportWizardStore((s) => s.batchEditPanel);
  const updateRow = useImportWizardStore((s) => s.updateRow);
  const openBatchEditPanel = useImportWizardStore((s) => s.openBatchEditPanel);
  const closeBatchEditPanel = useImportWizardStore((s) => s.closeBatchEditPanel);
  const applyBatchEdit = useImportWizardStore((s) => s.applyBatchEdit);

  const handleCellEdit = (rowId: string, field: string, value: unknown): void => {
    if (field !== 'title' && field !== 'category') {
      return;
    }

    if (typeof value !== 'string') {
      return;
    }

    const newValue = value;
    const editedRow = rows.find((r) => r.id === rowId);
    if (!editedRow) {
      return;
    }

    const originalValue = editedRow[field] ?? '';

    // Apply the edit to the current row immediately
    updateRow(rowId, { [field]: newValue });

    // HIGH-3 FIX: Re-validate after edit — empty title = error
    if (field === 'title' && !newValue.trim()) {
      const store = useImportWizardStore.getState();
      const updatedRows = store.rows.map((r) =>
        r.id === rowId
          ? { ...r, status: 'error' as const, statusReason: 'Empty title' }
          : r,
      );
      store.setRows(updatedRows);
      return; // Don't offer batch edit for invalid value
    }

    // Find similar rows that could benefit from the same edit
    const similar = findSimilarRows(rows, rowId, originalValue);

    if (similar.length > 0) {
      openBatchEditPanel({
        editedRowId: rowId,
        field,
        originalValue,
        newValue,
        similarRowIds: similar.map((r) => r.id),
      });
    }
  };

  const handleApply = (): void => {
    applyBatchEdit();
  };

  const handleSkip = (): void => {
    closeBatchEditPanel();
  };

  // Resolve similar rows from IDs for display
  const pendingEdit = batchEditPanel.pendingEdit;
  const similarRows: ReadonlyArray<TransactionRow> = pendingEdit
    ? rows.filter((r) => pendingEdit.similarRowIds.includes(r.id))
    : [];

  return {
    isOpen: batchEditPanel.isOpen,
    field: batchEditPanel.pendingEdit?.field,
    originalValue: batchEditPanel.pendingEdit?.originalValue ?? '',
    newValue: batchEditPanel.pendingEdit?.newValue ?? '',
    similarRows,
    handleCellEdit,
    handleApply,
    handleSkip,
  };
};
