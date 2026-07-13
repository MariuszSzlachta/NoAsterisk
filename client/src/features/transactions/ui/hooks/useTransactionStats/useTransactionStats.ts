import { useMemo } from 'react';

import { computeStats, filterTransactions } from '#features/transactions/model/filter-engine';
import { mapStoredToViewModel } from '#features/transactions/model/transformers';
import type { TransactionStats } from '#features/transactions/model/types';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';

import { useTransactionFilters } from '../useTransactionFilters';

// ─── Hook ────────────────────────────────────────────────────────

export const useTransactionStats = (): TransactionStats => {
  const transactions = useTransactionsStore((s) => s.transactions);
  const { filters } = useTransactionFilters();

  const viewModels = useMemo(
    () => transactions.map((tx) => mapStoredToViewModel(tx)),
    [transactions],
  );

  const filtered = useMemo(
    () => filterTransactions(viewModels, filters),
    [viewModels, filters],
  );

  return useMemo(() => computeStats(filtered), [filtered]);
};
