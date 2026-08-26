import { useState } from 'react';
import { format } from 'date-fns';

import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import { computeNextPeriod, getPeriodRange } from '#features/budgets/model/transformers';
import type { BudgetViewModel, RolloverOption } from '#features/budgets/model/types';
import type { SelectOption } from '#shared/ui/Select';

// ─── Types ───────────────────────────────────────────────────────

type ClosureOption = 'carry_forward' | 'savings' | 'discard';

interface UsePeriodClosureProps {
  readonly budgetId: string;
  readonly vm: BudgetViewModel;
  readonly onClose: () => void;
}

interface UsePeriodClosureReturn {
  readonly selectedOption: ClosureOption;
  readonly selectedSavingsBudgetId: string;
  readonly savingsBudgetOptions: readonly SelectOption[];
  readonly hasSavingsBudgets: boolean;
  readonly hasSurplus: boolean;
  readonly isSubmitDisabled: boolean;
  readonly handleOptionChange: (option: ClosureOption) => void;
  readonly handleSavingsSelect: (budgetId: string) => void;
  readonly handleSubmit: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const usePeriodClosure = ({ budgetId, vm, onClose }: UsePeriodClosureProps): UsePeriodClosureReturn => {
  const allBudgets = useBudgetsStore((s) => s.budgets);
  const closeBudgetPeriod = useBudgetsStore((s) => s.closeBudgetPeriod);

  const [selectedOption, setSelectedOption] = useState<ClosureOption>(
    vm.remaining > 0 ? 'carry_forward' : 'discard',
  );
  const [selectedSavingsBudgetId, setSelectedSavingsBudgetId] = useState('');

  const hasSurplus = vm.remaining > 0;

  // Savings budgets for dropdown
  const savingsBudgetOptions: readonly SelectOption[] = allBudgets
    .filter((b) => b.budgetType === 'savings' && !b.isArchived)
    .map((b) => ({ value: b.id, label: b.name }));

  const hasSavingsBudgets = savingsBudgetOptions.length > 0;

  // Disable submit when savings selected but no target
  const isSubmitDisabled = selectedOption === 'savings' && selectedSavingsBudgetId === '';

  const handleOptionChange = (option: ClosureOption): void => {
    setSelectedOption(option);
  };

  const handleSavingsSelect = (id: string): void => {
    setSelectedSavingsBudgetId(id);
  };

  const handleSubmit = (): void => {
    // Enforce savings target invariant (not just UI disabled state)
    if (selectedOption === 'savings' && !selectedSavingsBudgetId) {
      return;
    }

    // Read fresh budget data from store (not stale VM)
    const budget = useBudgetsStore.getState().budgets.find((b) => b.id === budgetId);
    if (!budget || budget.period === null) {
      return;
    }

    const { from, to } = getPeriodRange(budget.period, new Date());
    const periodFrom = format(from, 'yyyy-MM-dd');
    const periodTo = format(to, 'yyyy-MM-dd');
    const nextPeriod = computeNextPeriod(budget.period);

    const rolloverOption: RolloverOption = selectedOption === 'carry_forward'
      ? { type: 'carry_forward' }
      : selectedOption === 'savings'
        ? { type: 'savings', targetBudgetId: selectedSavingsBudgetId }
        : { type: 'discard' };

    // Use VM values for spent/remaining — they are the latest rendered values
    // The store-level closeBudgetPeriod validates these are finite numbers
    closeBudgetPeriod({
      budgetId,
      spentAmount: vm.spent,
      remainingAmount: vm.remaining,
      rolloverOption,
      periodFrom,
      periodTo,
      nextPeriod,
    });

    onClose();
  };

  return {
    selectedOption,
    selectedSavingsBudgetId,
    savingsBudgetOptions,
    hasSavingsBudgets,
    hasSurplus,
    isSubmitDisabled,
    handleOptionChange,
    handleSavingsSelect,
    handleSubmit,
  };
};
