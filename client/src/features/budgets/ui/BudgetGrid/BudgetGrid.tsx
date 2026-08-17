import { useTranslation } from 'react-i18next';
import type { DateRange } from 'react-day-picker';

import type { BudgetFilterTab, BudgetPeriodFilter } from '#features/budgets/model/types';

import { BudgetCard } from '../BudgetCard';
import { useBudgetGrid } from '../hooks/useBudgetGrid';

// ─── Props ───────────────────────────────────────────────────────

interface BudgetGridProps {
  readonly activeTab: BudgetFilterTab;
  readonly selectedPeriod: BudgetPeriodFilter;
  readonly customRange?: DateRange;
  readonly onAssignTransaction?: (budgetId: string) => void;
  readonly onClosePeriod?: (budgetId: string) => void;
}

// ─── Component ───────────────────────────────────────────────────

export const BudgetGrid = ({ activeTab, selectedPeriod, customRange, onAssignTransaction, onClosePeriod }: BudgetGridProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { budgets, isEmpty } = useBudgetGrid(activeTab, selectedPeriod, customRange);

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-12 text-center">
        <span className="text-sm text-muted-foreground">
          {t('budgets.grid.empty')}
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {budgets.map((vm) => (
        <BudgetCard
          key={vm.id}
          vm={vm}
          onAssignTransaction={onAssignTransaction}
          onClosePeriod={onClosePeriod}
        />
      ))}
    </div>
  );
};
