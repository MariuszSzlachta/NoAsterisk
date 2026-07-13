import type { CategoryInfo } from '#features/transactions/model/types';

import { useTransactionSelection } from '../useTransactionSelection';

// ─── Stub categories (placeholder until categories feature exists) ─────

const STUB_CATEGORIES: ReadonlyArray<CategoryInfo> = [
  { id: 'cat-groceries', label: 'Spożywcze', color: '#4ade80' },
  { id: 'cat-transport', label: 'Transport', color: '#f59e0b' },
  { id: 'cat-subscriptions', label: 'Subskrypcje', color: '#8b5cf6' },
  { id: 'cat-housing', label: 'Mieszkanie', color: '#06b6d4' },
  { id: 'cat-salary', label: 'Wynagrodzenie', color: '#60a5fa' },
  { id: 'cat-entertainment', label: 'Rozrywka', color: '#ec4899' },
  { id: 'cat-health', label: 'Zdrowie', color: '#ef4444' },
  { id: 'cat-other', label: 'Inne', color: '#94a3b8' },
];

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
