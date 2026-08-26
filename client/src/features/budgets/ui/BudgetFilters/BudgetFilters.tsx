import { useTranslation } from 'react-i18next';
import type { DateRange } from 'react-day-picker';

import { DateRangePicker } from '#shared/ui/DateRangePicker';
import { FilterTabs } from '#shared/ui/FilterTabs';
import type { FilterTab } from '#shared/ui/FilterTabs';

import type { BudgetFilterTab, BudgetPeriodFilter } from '#features/budgets/model/types';

// ─── Props ───────────────────────────────────────────────────────

interface BudgetFiltersProps {
  readonly statusTabs: readonly FilterTab[];
  readonly activeTab: BudgetFilterTab;
  readonly onTabChange: (id: BudgetFilterTab) => void;
  readonly selectedPeriod: BudgetPeriodFilter;
  readonly onPeriodChange: (id: BudgetPeriodFilter) => void;
  readonly customRange?: DateRange;
  readonly onCustomRangeChange?: (range: DateRange | undefined) => void;
}

// ─── Component ───────────────────────────────────────────────────

export const BudgetFilters = ({
  statusTabs,
  activeTab,
  onTabChange,
  selectedPeriod,
  onPeriodChange,
  customRange,
  onCustomRangeChange,
}: BudgetFiltersProps): React.JSX.Element => {
  const { t } = useTranslation();

  const periodTabs: readonly FilterTab[] = [
    { id: 'monthly', label: t('budgets.filters.monthly') },
    { id: 'yearly', label: t('budgets.filters.yearly') },
    { id: 'custom', label: t('budgets.filters.custom') },
  ];

  const isCustom = selectedPeriod === 'custom';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <FilterTabs tabs={statusTabs} activeTab={activeTab} onTabChange={onTabChange as (id: string) => void} />
        <div className="flex items-center gap-3">
          <FilterTabs tabs={periodTabs} activeTab={selectedPeriod} onTabChange={onPeriodChange as (id: string) => void} />
          {isCustom && onCustomRangeChange && (
            <DateRangePicker
              selected={customRange}
              onSelect={onCustomRangeChange}
              placeholder={t('budgets.filters.customPlaceholder')}
            />
          )}
        </div>
      </div>
    </div>
  );
};
