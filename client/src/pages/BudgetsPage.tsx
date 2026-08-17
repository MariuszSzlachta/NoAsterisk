import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DateRange } from 'react-day-picker';
import { Plus } from 'lucide-react';

import type { FilterTab } from '#shared/ui/FilterTabs';
import { Button } from '#shared/ui/Button';

import { BudgetKpiRow, BudgetFilters, BudgetGrid, BudgetFormModal, SavingsBudgetCard, PeriodClosureModal } from '#features/budgets';
import { useBudgetsStore, usePeriodHistoryStore, mapBudgetRecordToViewModel } from '#features/budgets';
import type { BudgetFilterTab, BudgetPeriodFilter } from '#features/budgets';
// ARCH-EXCEPTION: cross-feature import — page needs transaction data for closure modal VM.
import { useTransactionsStore } from '#features/transactions';

// ─── Constants ───────────────────────────────────────────────────

const VALID_FILTER_TABS: ReadonlyArray<BudgetFilterTab> = ['all', 'needsAttention'];

const isBudgetFilterTab = (value: string): value is BudgetFilterTab =>
  (VALID_FILTER_TABS as ReadonlyArray<string>).includes(value);

const VALID_PERIODS: ReadonlyArray<BudgetPeriodFilter> = ['monthly', 'yearly', 'custom'];

const isBudgetPeriodFilter = (value: string): value is BudgetPeriodFilter =>
  (VALID_PERIODS as ReadonlyArray<string>).includes(value);

// ─── Page ────────────────────────────────────────────────────────

export const BudgetsPage = (): React.JSX.Element => {
  const { t } = useTranslation();
  const allBudgets = useBudgetsStore((s) => s.budgets);

  const [activeTab, setActiveTab] = useState<BudgetFilterTab>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriodFilter>('monthly');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [isSavingsFormOpen, setIsSavingsFormOpen] = useState(false);
  const [closingBudgetId, setClosingBudgetId] = useState<string | null>(null);

  const savingsBudgets = allBudgets.filter((b) => b.budgetType === 'savings' && !b.isArchived);

  const transactions = useTransactionsStore((s) => s.transactions);
  const periodHistory = usePeriodHistoryStore((s) => s.history);

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
    setIsSavingsFormOpen(true);
  };

  const handleCloseSavingsForm = (): void => {
    setIsSavingsFormOpen(false);
  };

  const handleClosePeriod = (budgetId: string): void => {
    setClosingBudgetId(budgetId);
  };

  const handleCloseClosureModal = (): void => {
    setClosingBudgetId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <BudgetKpiRow />
      <BudgetFilters
        statusTabs={statusTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        customRange={customRange}
        onCustomRangeChange={handleCustomRangeChange}
      />
      <BudgetGrid activeTab={activeTab} selectedPeriod={selectedPeriod} customRange={customRange} onClosePeriod={handleClosePeriod} />

      {/* Period closure modal */}
      {closingBudgetId && closingBudgetVm && (
        <PeriodClosureModal
          budgetId={closingBudgetId}
          vm={closingBudgetVm}
          onClose={handleCloseClosureModal}
        />
      )}

      {/* Savings budgets section */}
      <section className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            {t('budgets.savings.title')}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleOpenSavingsForm}>
            <Plus size={14} />
            {t('budgets.savings.create')}
          </Button>
        </div>

        {savingsBudgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-12 text-center">
            <span className="text-sm text-muted-foreground">
              {t('budgets.savings.empty')}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {savingsBudgets.map((b) => (
              <SavingsBudgetCard key={b.id} budgetId={b.id} />
            ))}
          </div>
        )}
      </section>

      {/* Savings form modal */}
      <BudgetFormModal
        isOpen={isSavingsFormOpen}
        initialBudgetType="savings"
        onClose={handleCloseSavingsForm}
      />
    </div>
  );
};
