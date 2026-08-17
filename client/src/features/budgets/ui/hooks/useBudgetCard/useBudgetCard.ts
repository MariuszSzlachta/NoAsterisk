import { useState } from 'react';

interface UseBudgetCardProps {
  readonly budgetId: string;
  readonly onAssignTransaction?: (budgetId: string) => void;
}

interface UseBudgetCardReturn {
  readonly isExpanded: boolean;
  readonly handleToggleExpand: () => void;
  readonly handleAssignTransaction: () => void;
}

export const useBudgetCard = ({ budgetId, onAssignTransaction }: UseBudgetCardProps): UseBudgetCardReturn => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = (): void => {
    setIsExpanded((prev) => !prev);
  };

  const handleAssignTransaction = (): void => {
    onAssignTransaction?.(budgetId);
  };

  return { isExpanded, handleToggleExpand, handleAssignTransaction };
};
