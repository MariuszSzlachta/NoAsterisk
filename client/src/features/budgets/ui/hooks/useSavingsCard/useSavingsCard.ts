import { useMemo, useState } from 'react';

import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';
import { mapSavingsBudgetToViewModel } from '#features/budgets/model/transformers';
import { getInflowHistory } from '#features/budgets/model/period-history';
import type { SavingsBudgetViewModel } from '#features/budgets/model/types';

// ─── Types ───────────────────────────────────────────────────────

export interface InflowDisplayEntry {
  readonly id: string;
  readonly amount: number;
  readonly sourceBudgetName: string | undefined;
  readonly displayDate: string;
}

interface UseSavingsCardProps {
  readonly budgetId: string;
}

interface UseSavingsCardReturn {
  readonly vm: SavingsBudgetViewModel | null;
  readonly inflowHistory: readonly InflowDisplayEntry[];
  readonly isHistoryExpanded: boolean;
  readonly handleToggleHistory: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useSavingsCard = ({ budgetId }: UseSavingsCardProps): UseSavingsCardReturn => {
  const allBudgets = useBudgetsStore((s) => s.budgets);
  const history = usePeriodHistoryStore((s) => s.history);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const budget = allBudgets.find((b) => b.id === budgetId);

  const vm = useMemo(
    () => (budget ? mapSavingsBudgetToViewModel(budget, history, allBudgets) : null),
    [budget, history, allBudgets],
  );

  const inflowHistory: readonly InflowDisplayEntry[] = useMemo(
    () =>
      budget
        ? getInflowHistory(budgetId, history, allBudgets).map((entry) => ({
            id: entry.id,
            amount: entry.amount,
            sourceBudgetName: entry.sourceBudgetName,
            displayDate: entry.date.split('T')[0] ?? entry.date,
          }))
        : [],
    [budget, budgetId, history, allBudgets],
  );

  const handleToggleHistory = (): void => {
    setIsHistoryExpanded((prev) => !prev);
  };

  return {
    vm,
    inflowHistory,
    isHistoryExpanded,
    handleToggleHistory,
  };
};
