import { useState } from 'react';

import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';

// ─── Types ───────────────────────────────────────────────────────

interface UseTransactionSelectionResult {
  readonly selectedIds: ReadonlyArray<string>;
  readonly selectionCount: number;
  readonly hasSelection: boolean;
  readonly handleSelectionChange: (ids: string[]) => void;
  readonly handleBulkCategoryChange: (categoryId: string) => void;
  readonly clearSelection: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useTransactionSelection = (): UseTransactionSelectionResult => {
  const [selectedIds, setSelectedIds] = useState<ReadonlyArray<string>>([]);
  const bulkUpdateCategory = useTransactionsStore((s) => s.bulkUpdateCategory);

  const handleSelectionChange = (ids: string[]): void => {
    setSelectedIds(ids);
  };

  const handleBulkCategoryChange = (categoryId: string): void => {
    bulkUpdateCategory(selectedIds, categoryId);
    setSelectedIds([]);
  };

  const clearSelection = (): void => {
    setSelectedIds([]);
  };

  return {
    selectedIds,
    selectionCount: selectedIds.length,
    hasSelection: selectedIds.length > 0,
    handleSelectionChange,
    handleBulkCategoryChange,
    clearSelection,
  };
};
