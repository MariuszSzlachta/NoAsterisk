import { useTranslation } from 'react-i18next';
import type { DateRange } from 'react-day-picker';

import type { FilterTab } from '#shared/ui/FilterTabs';
import {
  useBudgetsStore,
  useBudgetsPageStore,
  usePeriodHistoryStore,
  mapBudgetRecordToViewModel,
} from '#features/budgets';
import type { BudgetFilterTab, BudgetPeriodFilter, BudgetViewModel } from '#features/budgets';
import { useTransactionsStore } from '#features/transactions';

// ─── Constants ───────────────────────────────────────────────────

const VALID_FILTER_TABS: ReadonlyArray<BudgetFilterTab> = ['all', 'needsAttention'];

const isBudgetFilterTab = (value: string): value is BudgetFilterTab =>
  VALID_FILTER_TABS.some((tab) => tab === value);

const VALID_PERIODS: ReadonlyArray<BudgetPeriodFilter> = ['monthly', 'yearly', 'custom'];

const isBudgetPeriodFilter = (value: string): value is BudgetPeriodFilter =>
  VALID_PERIODS.some((period) => period === value);

// ─── Result Interface ────────────────────────────────────────────

interface UseBudgetsPageResult {
  readonly activeTab: BudgetFilterTab;
  readonly selectedPeriod: BudgetPeriodFilter;
  readonly customRange: DateRange | undefined;
  readonly isSavingsFormOpen: boolean;
  readonly closingBudgetId: string | null;
  readonly closingBudgetVm: BudgetViewModel | null;
  readonly savingsBudgets: ReadonlyArray<{ readonly id: string }>;
  readonly statusTabs: readonly FilterTab[];
  readonly handleTabChange: (tab: string) => void;
  readonly handlePeriodChange: (period: string) => void;
  readonly handleCustomRangeChange: (range: DateRange | undefined) => void;
  readonly handleOpenSavingsForm: () => void;
  readonly handleCloseSavingsForm: () => void;
  readonly handleClosePeriod: (budgetId: string) => void;
  readonly handleCloseClosureModal: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useBudgetsPage = (): UseBudgetsPageResult => {
  const { t } = useTranslation();
  const allBudgets = useBudgetsStore((s) => s.budgets);
  const transactions = useTransactionsStore((s) => s.transactions);
  const periodHistory = usePeriodHistoryStore((s) => s.history);

  const activeTab = useBudgetsPageStore((s) => s.activeTab);
  const selectedPeriod = useBudgetsPageStore((s) => s.selectedPeriod);
  const customRange = useBudgetsPageStore((s) => s.customRange);
  const isSavingsFormOpen = useBudgetsPageStore((s) => s.isSavingsFormOpen);
  const closingBudgetId = useBudgetsPageStore((s) => s.closingBudgetId);
  const setActiveTab = useBudgetsPageStore((s) => s.setActiveTab);
  const setSelectedPeriod = useBudgetsPageStore((s) => s.setSelectedPeriod);
  const setCustomRange = useBudgetsPageStore((s) => s.setCustomRange);
  const openSavingsForm = useBudgetsPageStore((s) => s.openSavingsForm);
  const closeSavingsForm = useBudgetsPageStore((s) => s.closeSavingsForm);
  const openClosureModal = useBudgetsPageStore((s) => s.openClosureModal);
  const closeClosureModal = useBudgetsPageStore((s) => s.closeClosureModal);

  const savingsBudgets = allBudgets.filter((b) => b.budgetType === 'savings' && !b.isArchived);

  const closingBudget = closingBudgetId
    ? allBudgets.find((b) => b.id === closingBudgetId)
    : null;

  const closingBudgetVm = closingBudget && closingBudget.period
    ? mapBudgetRecordToViewModel(closingBudget, transactions, new Date(), periodHistory)
    : null;

  const statusTabs: readonly FilterTab[] = [
    { id: 'all', label: t('budgets.filters.all') },
    { id: 'needsAttention', label: t('budgets.filters.needsAttention') },
  ];

  const handleTabChange = (tab: string): void => {
    if (isBudgetFilterTab(tab)) {
      setActiveTab(tab);
    }
  };

  const handlePeriodChange = (period: string): void => {
    if (isBudgetPeriodFilter(period)) {
      setSelectedPeriod(period);
    }
  };

  const handleCustomRangeChange = (range: DateRange | undefined): void => {
    setCustomRange(range);
  };

  const handleOpenSavingsForm = (): void => {
    openSavingsForm();
  };

  const handleCloseSavingsForm = (): void => {
    closeSavingsForm();
  };

  const handleClosePeriod = (budgetId: string): void => {
    openClosureModal(budgetId);
  };

  const handleCloseClosureModal = (): void => {
    closeClosureModal();
  };

  return {
    activeTab,
    selectedPeriod,
    customRange,
    isSavingsFormOpen,
    closingBudgetId,
    closingBudgetVm,
    savingsBudgets,
    statusTabs,
    handleTabChange,
    handlePeriodChange,
    handleCustomRangeChange,
    handleOpenSavingsForm,
    handleCloseSavingsForm,
    handleClosePeriod,
    handleCloseClosureModal,
  };
};
