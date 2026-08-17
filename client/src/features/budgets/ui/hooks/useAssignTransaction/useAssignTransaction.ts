import { type ChangeEvent, useState } from 'react';
import { parseISO } from 'date-fns';

// ARCH-EXCEPTION: cross-feature import — budgets needs to assign budgetId on transactions.
// Transactions feature exports useTransactionsStore via its public API (index.ts).
import { useTransactionsStore } from '#features/transactions';

import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import { getPeriodRange } from '#features/budgets/model/transformers';
import type { BudgetTransactionInput } from '#features/budgets/model/types';

// ─── Hook Interface ──────────────────────────────────────────────

interface UseAssignTransactionProps {
  readonly budgetId: string;
  readonly onClose: () => void;
}

interface UseAssignTransactionReturn {
  readonly unassignedTransactions: readonly BudgetTransactionInput[];
  readonly selectedIds: ReadonlySet<string>;
  readonly searchQuery: string;
  readonly hasSelection: boolean;
  readonly handleToggleSelection: (txId: string) => void;
  readonly handleSelectAll: () => void;
  readonly handleDeselectAll: () => void;
  readonly handleSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handleAssign: () => void;
  readonly filteredCount: number;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useAssignTransaction = ({ budgetId, onClose }: UseAssignTransactionProps): UseAssignTransactionReturn => {
  const transactions = useTransactionsStore((s) => s.transactions);
  const assignBudget = useTransactionsStore((s) => s.assignBudget);
  const budgets = useBudgetsStore((s) => s.budgets);

  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const budget = budgets.find((b) => b.id === budgetId);
  const now = new Date();

  // Get unassigned transactions within budget's period
  const unassignedTransactions: readonly BudgetTransactionInput[] = (() => {
    if (!budget) {
      return [];
    }
    const { from, to } = getPeriodRange(budget.period, now);
    return transactions.filter((tx) => {
      if (tx.budgetId !== undefined) {
        return false;
      }
      const txDate = parseISO(tx.date);
      return txDate >= from && txDate <= to;
    });
  })();

  // Apply search filter
  const filteredTransactions = searchQuery.trim()
    ? unassignedTransactions.filter((tx) =>
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : unassignedTransactions;

  const hasSelection = selectedIds.size > 0;

  const handleToggleSelection = (txId: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  };

  const handleSelectAll = (): void => {
    setSelectedIds(new Set(filteredTransactions.map((tx) => tx.id)));
  };

  const handleDeselectAll = (): void => {
    setSelectedIds(new Set());
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const handleAssign = (): void => {
    if (selectedIds.size === 0) {
      return;
    }
    assignBudget(Array.from(selectedIds), budgetId);
    setSelectedIds(new Set());
    onClose();
  };

  return {
    unassignedTransactions: filteredTransactions,
    selectedIds,
    searchQuery,
    hasSelection,
    handleToggleSelection,
    handleSelectAll,
    handleDeselectAll,
    handleSearchChange,
    handleAssign,
    filteredCount: filteredTransactions.length,
  };
};
