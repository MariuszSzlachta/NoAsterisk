import { STUB_CATEGORIES, type CategoryInfo } from '#entities/category';

import { useTransactionSelection } from '../useTransactionSelection';

// ─── Types ───────────────────────────────────────────────────────

interface UseTransactionsPageWiringResult {
  readonly selectionCount: number;
  readonly categories: ReadonlyArray<CategoryInfo>;
  readonly handleSelectionChange: (ids: string[]) => void;
  readonly handleBulkCategoryChange: (categoryId: string) => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useTransactionsPageWiring = (): UseTransactionsPageWiringResult => {
  const {
    selectionCount,
    handleSelectionChange,
    handleBulkCategoryChange,
  } = useTransactionSelection();

  return {
    selectionCount,
    categories: STUB_CATEGORIES,
    handleSelectionChange,
    handleBulkCategoryChange,
  };
};
