import { useTranslation } from 'react-i18next';
import type { DateRange } from 'react-day-picker';

import { DateRangePicker } from '#shared/ui/DateRangePicker';
import { FilterTabs } from '#shared/ui/FilterTabs';
import type { FilterTab } from '#shared/ui/FilterTabs';

import type { BudgetFilterTab } from '#features/budgets/model/types/budget-filter-tab';
import type { BudgetPeriodFilter } from '#features/budgets/model/types/budget-period-filter';

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
      <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <FilterTabs
          tabs={statusTabs}
          activeTab={activeTab}
          onTabChange={(id) => {
            if (id === 'all' || id === 'needsAttention') onTabChange(id);
          }}
          className="w-full gap-2 [&>button]:min-h-10 [&>button]:flex-1 [&>button]:px-4 [&>button]:text-sm lg:w-auto lg:[&>button]:min-h-0 lg:[&>button]:flex-none lg:[&>button]:px-3 lg:[&>button]:text-xs"
        />
        <div className="flex w-full flex-col items-stretch gap-2 lg:w-auto lg:flex-row lg:items-center">
          <FilterTabs
            tabs={periodTabs}
            activeTab={selectedPeriod}
            onTabChange={(id) => {
              if (id === 'monthly' || id === 'yearly' || id === 'custom') onPeriodChange(id);
            }}
            className="w-full gap-2 [&>button]:min-h-10 [&>button]:flex-1 [&>button]:px-4 [&>button]:text-sm lg:w-auto lg:[&>button]:min-h-0 lg:[&>button]:flex-none lg:[&>button]:px-3 lg:[&>button]:text-xs"
          />
          {isCustom && onCustomRangeChange && (
            <DateRangePicker
              selected={customRange}
              onSelect={onCustomRangeChange}
              placeholder={t('budgets.filters.customPlaceholder')}
              className="min-h-10 w-full px-4 text-sm lg:min-h-0 lg:w-auto lg:px-3 lg:text-xs"
            />
          )}
        </div>
      </div>
    </div>
  );
};
