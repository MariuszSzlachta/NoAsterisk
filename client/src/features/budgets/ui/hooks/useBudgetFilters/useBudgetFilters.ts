import { useState } from 'react';

import type { BudgetPeriodFilter } from '#features/budgets/model/types/budget-period-filter';

// ─── Type Guard ──────────────────────────────────────────────────

const VALID_PERIODS: ReadonlyArray<BudgetPeriodFilter> = ['monthly', 'yearly', 'custom', 'savings'];

const isBudgetPeriodFilter = (value: string): value is BudgetPeriodFilter =>
  VALID_PERIODS.some((period) => period === value);

// ─── Hook ────────────────────────────────────────────────────────

interface UseBudgetFiltersReturn {
  readonly selectedPeriod: BudgetPeriodFilter;
  readonly handlePeriodChange: (period: string) => void;
}

export const useBudgetFilters = (): UseBudgetFiltersReturn => {
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriodFilter>('monthly');

  const handlePeriodChange = (period: string): void => {
    if (isBudgetPeriodFilter(period)) {
      setSelectedPeriod(period);
    }
  };

  return { selectedPeriod, handlePeriodChange };
};
