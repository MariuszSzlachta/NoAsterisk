import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '#shared/ui/Button';
import { ConfirmDialog } from '#shared/ui/ConfirmDialog';
import {
  BudgetKpiRow,
  BudgetFilters,
  BudgetGrid,
  BudgetFormModal,
  SavingsBudgetCard,
  PeriodClosureModal,
  useBudgetsStore,
} from '#features/budgets';
import type { BudgetRecord } from '#features/budgets';
// ARCH-EXCEPTION: cross-feature import — page needs transaction data for closure modal VM.

import { useBudgetsPage } from '#pages/BudgetsPage/useBudgetsPage';

// ─── Page ────────────────────────────────────────────────────────

export const BudgetsPage = (): React.JSX.Element => {
  const { t } = useTranslation();
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const budgets = useBudgetsStore((state) => state.budgets);
  const deleteBudget = useBudgetsStore((state) => state.deleteBudget);
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

  const editingBudget: BudgetRecord | undefined = editingBudgetId
    ? budgets.find((budget) => budget.id === editingBudgetId)
    : undefined;

  const handleOpenCreateForm = (): void => {
    setEditingBudgetId(null);
    handleOpenSavingsForm();
  };

  const handleOpenEditForm = (budgetId: string): void => {
    setEditingBudgetId(budgetId);
    handleOpenSavingsForm();
  };

  const handleCloseBudgetForm = (): void => {
    setEditingBudgetId(null);
    handleCloseSavingsForm();
  };

  const handleRequestDeleteBudget = (budgetId: string): void => {
    setDeletingBudgetId(budgetId);
  };

  const handleCancelDeleteBudget = (): void => {
    setDeletingBudgetId(null);
  };

  const handleConfirmDeleteBudget = (): void => {
    if (!deletingBudgetId) {
      return;
    }
    deleteBudget(deletingBudgetId);
    if (editingBudgetId === deletingBudgetId) {
      handleCloseBudgetForm();
    }
    setDeletingBudgetId(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleOpenCreateForm}>
          <Plus size={14} />
          {t('budgets.create')}
        </Button>
      </div>
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
      <BudgetGrid
        activeTab={activeTab}
        selectedPeriod={selectedPeriod}
        customRange={customRange}
        onClosePeriod={handleClosePeriod}
        onEditBudget={handleOpenEditForm}
        onDeleteBudget={handleRequestDeleteBudget}
      />

      {closingBudgetId && closingBudgetVm && (
        <PeriodClosureModal
          budgetId={closingBudgetId}
          vm={closingBudgetVm}
          onClose={handleCloseClosureModal}
        />
      )}

      <section className="mt-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">
            {t('budgets.savings.title')}
          </h2>
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
              <SavingsBudgetCard
                key={b.id}
                budgetId={b.id}
                onEditBudget={handleOpenEditForm}
                onDeleteBudget={handleRequestDeleteBudget}
              />
            ))}
          </div>
        )}
      </section>

      <BudgetFormModal
        isOpen={isSavingsFormOpen}
        editBudget={editingBudget}
        onClose={handleCloseBudgetForm}
      />
      <ConfirmDialog
        isOpen={deletingBudgetId !== null}
        title={t('budgets.delete.title')}
        description={t('budgets.delete.description')}
        cancelLabel={t('budgets.delete.cancel')}
        confirmLabel={t('budgets.delete.confirm')}
        onCancel={handleCancelDeleteBudget}
        onConfirm={handleConfirmDeleteBudget}
      />
    </div>
  );
};
