import { useState } from 'react';

import type { BudgetStatus } from '#features/budgets/model/types/budget-status';

interface UseBudgetCardProps {
  readonly budgetId: string;
  readonly status: BudgetStatus;
  readonly remaining: number;
  readonly onAssignTransaction?: (budgetId: string) => void;
  readonly onClosePeriod?: (budgetId: string) => void;
}

interface UseBudgetCardReturn {
  readonly isExpanded: boolean;
  readonly isAwaitingClosure: boolean;
  readonly closePeriodLabel: string;
  readonly handleToggleExpand: () => void;
  readonly handleAssignTransaction: () => void;
  readonly handleClosePeriod: () => void;
}

export const useBudgetCard = ({
  budgetId,
  status,
  remaining,
  onAssignTransaction,
  onClosePeriod,
}: UseBudgetCardProps): UseBudgetCardReturn => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isAwaitingClosure = status === 'awaitingClosure';

  const closePeriodLabel = remaining > 0
    ? 'budgets.card.closePeriod'
    : 'budgets.card.closeAndReopen';

  const handleToggleExpand = (): void => {
    setIsExpanded((prev) => !prev);
  };

  const handleAssignTransaction = (): void => {
    onAssignTransaction?.(budgetId);
  };

  const handleClosePeriod = (): void => {
    onClosePeriod?.(budgetId);
  };

  return {
    isExpanded,
    isAwaitingClosure,
    closePeriodLabel,
    handleToggleExpand,
    handleAssignTransaction,
    handleClosePeriod,
  };
};
