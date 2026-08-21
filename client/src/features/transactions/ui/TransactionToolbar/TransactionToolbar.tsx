import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { DateRangePicker } from '#shared/ui/DateRangePicker';
import { FilterTabs } from '#shared/ui/FilterTabs';
import { Input } from '#shared/ui/Input';
import type { CategoryInfo } from '#entities/category';

import { CategoryPicker } from '../CategoryPicker';
import { useTransactionToolbar } from '../hooks/useTransactionToolbar';

// ─── Constants ───────────────────────────────────────────────────

const TYPE_TABS = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'income', label: 'Przychody' },
  { id: 'expense', label: 'Wydatki' },
] as const;

// ─── Types ───────────────────────────────────────────────────────

interface TransactionToolbarProps {
  readonly selectionCount?: number;
  readonly onBulkCategoryChange?: (categoryId: string) => void;
  readonly categories?: ReadonlyArray<CategoryInfo>;
}

// ─── Component ───────────────────────────────────────────────────

export const TransactionToolbar = ({
  selectionCount = 0,
  onBulkCategoryChange,
  categories = [],
}: TransactionToolbarProps): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    searchValue,
    activeTypeTab,
    dateRange,
    handleSearchInputChange,
    handleTypeTabChange,
    handleDateRangeChange,
  } = useTransactionToolbar();

  const hasSelection = selectionCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="w-64">
        <Input
          placeholder={t('transactions.filterPlaceholder')}
          icon={<Search size={14} />}
          value={searchValue}
          onChange={handleSearchInputChange}
        />
      </div>

      <FilterTabs
        tabs={TYPE_TABS}
        activeTab={activeTypeTab}
        onTabChange={handleTypeTabChange}
      />

      <DateRangePicker
        selected={dateRange}
        onSelect={handleDateRangeChange}
      />

      {hasSelection && onBulkCategoryChange && (
        <div className="ml-auto">
          <CategoryPicker
            categories={categories}
            onSelect={onBulkCategoryChange}
            selectionCount={selectionCount}
          />
        </div>
      )}
    </div>
  );
};
