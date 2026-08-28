import { create } from 'zustand';
import type { DateRange } from 'react-day-picker';

import type { BudgetFilterTab } from '#features/budgets/model/types/budget-filter-tab';
import type { BudgetPeriodFilter } from '#features/budgets/model/types/budget-period-filter';

// ─── State Interface ─────────────────────────────────────────────

interface BudgetsPageState {
  readonly activeTab: BudgetFilterTab;
  readonly selectedPeriod: BudgetPeriodFilter;
  readonly customRange: DateRange | undefined;
  readonly isSavingsFormOpen: boolean;
  readonly closingBudgetId: string | null;
  readonly setActiveTab: (tab: BudgetFilterTab) => void;
  readonly setSelectedPeriod: (period: BudgetPeriodFilter) => void;
  readonly setCustomRange: (range: DateRange | undefined) => void;
  readonly openSavingsForm: () => void;
  readonly closeSavingsForm: () => void;
  readonly openClosureModal: (budgetId: string) => void;
  readonly closeClosureModal: () => void;
}

// ─── Store ───────────────────────────────────────────────────────

export const useBudgetsPageStore = create<BudgetsPageState>((set) => ({
  activeTab: 'all',
  selectedPeriod: 'monthly',
  customRange: undefined,
  isSavingsFormOpen: false,
  closingBudgetId: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  setCustomRange: (range) => set({ customRange: range }),
  openSavingsForm: () => set({ isSavingsFormOpen: true }),
  closeSavingsForm: () => set({ isSavingsFormOpen: false }),
  openClosureModal: (budgetId) => set({ closingBudgetId: budgetId }),
  closeClosureModal: () => set({ closingBudgetId: null }),
}));
