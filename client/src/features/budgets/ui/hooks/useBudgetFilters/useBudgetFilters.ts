import { useState } from 'react';

import type { BudgetPeriodFilter } from '#features/budgets/model/types';

// ─── Type Guard ──────────────────────────────────────────────────

const VALID_PERIODS: ReadonlyArray<BudgetPeriodFilter> = ['monthly', 'yearly', 'custom'];

const isBudgetPeriodFilter = (value: string): value is BudgetPeriodFilter =>
  VALID_PERIODS.includes(value as BudgetPeriodFilter);

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
