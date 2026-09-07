import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '#shared/ui/Button';
import {
  BudgetKpiRow,
  BudgetFilters,
  BudgetGrid,
  BudgetFormModal,
  SavingsBudgetCard,
  PeriodClosureModal,
} from '#features/budgets';
// ARCH-EXCEPTION: cross-feature import — page needs transaction data for closure modal VM.

import { useBudgetsPage } from '#pages/BudgetsPage/useBudgetsPage';

// ─── Page ────────────────────────────────────────────────────────

export const BudgetsPage = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
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
  } = useBudgetsPage();

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

      {closingBudgetId && closingBudgetVm && (
        <PeriodClosureModal
          budgetId={closingBudgetId}
          vm={closingBudgetVm}
          onClose={handleCloseClosureModal}
        />
      )}

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

      <BudgetFormModal
        isOpen={isSavingsFormOpen}
        initialBudgetType="savings"
        onClose={handleCloseSavingsForm}
      />
    </div>
  );
};
