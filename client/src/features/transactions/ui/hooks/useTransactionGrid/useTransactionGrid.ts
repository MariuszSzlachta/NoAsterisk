import { useMemo } from 'react';

import {
  filterTransactions,
  paginateTransactions,
  sortTransactions,
} from '#features/transactions/model/filter-engine';
import { mapStoredToViewModel } from '#features/transactions/model/transformers';
import type { TransactionPage } from '#features/transactions/model/types';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';

import { useTransactionFilters } from '../useTransactionFilters';

// ─── Types ───────────────────────────────────────────────────────

interface UseTransactionGridResult {
  readonly page: TransactionPage;
  readonly handlePageChange: (newPage: number) => void;
  readonly handlePageSizeChange: (size: number) => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useTransactionGrid = (): UseTransactionGridResult => {
  const transactions = useTransactionsStore((s) => s.transactions);
  const { filters, sort, page, pageSize, setPage } = useTransactionFilters();

  const viewModels = useMemo(
    () => transactions.map((tx) => mapStoredToViewModel(tx)),
    [transactions],
  );

  const totalBeforeFilter = viewModels.length;

  const filtered = useMemo(
    () => filterTransactions(viewModels, filters),
    [viewModels, filters],
  );

  const sorted = useMemo(
    () => sortTransactions(filtered, sort),
    [filtered, sort],
  );

  const pageResult = useMemo(
    () => paginateTransactions(sorted, page, pageSize, totalBeforeFilter),
    [sorted, page, pageSize, totalBeforeFilter],
  );

  const handlePageChange = (newPage: number): void => {
    setPage(newPage);
  };

  const handlePageSizeChange = (_size: number): void => {
    // Page size is currently fixed; reserved for future URL param extension
    setPage(1);
  };

  return {
    page: pageResult,
    handlePageChange,
    handlePageSizeChange,
  };
};
