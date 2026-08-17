import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DateRange } from 'react-day-picker';

import type { FilterTab } from '#shared/ui/FilterTabs';

import { BudgetKpiRow, BudgetFilters, BudgetGrid } from '#features/budgets';
import type { BudgetFilterTab } from '#features/budgets';
import type { BudgetPeriodFilter } from '#features/budgets/model/types';

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
  const [activeTab, setActiveTab] = useState<BudgetFilterTab>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriodFilter>('monthly');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

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
      <BudgetGrid activeTab={activeTab} selectedPeriod={selectedPeriod} customRange={customRange} />
    </div>
  );
};
