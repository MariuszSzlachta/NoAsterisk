import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { CategoryInfo } from '#model/category';
import { Button } from '#shared/ui/Button';
import { DateRangePicker } from '#shared/ui/DateRangePicker';
import { FilterTabs } from '#shared/ui/FilterTabs';
import { Input } from '#shared/ui/Input';

import { CategoryPicker } from '../CategoryPicker';
import { useTransactionToolbar } from '../hooks/useTransactionToolbar';

// ─── Constants ───────────────────────────────────────────────────

const TYPE_TABS = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'income', label: 'Przychody' },
  { id: 'expense', label: 'Wydatki' },
];

// ─── Types ───────────────────────────────────────────────────────

interface TransactionToolbarProps {
  readonly selectionCount?: number;
  readonly onBulkCategoryChange?: (categoryId: string) => void;
  readonly categories?: ReadonlyArray<CategoryInfo>;
  readonly onAddTransaction?: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export const TransactionToolbar = ({
  selectionCount = 0,
  onBulkCategoryChange,
  categories = [],
  onAddTransaction,
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
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-full lg:w-64">
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
        className="w-full [&>button]:min-h-12 [&>button]:flex-1 [&>button]:justify-center [&>button]:rounded-md [&>button]:text-sm lg:w-auto lg:[&>button]:min-h-0 lg:[&>button]:flex-none lg:[&>button]:rounded-full"
      />

      <div className="flex w-full gap-2 lg:w-auto">
        <DateRangePicker
          selected={dateRange}
          onSelect={handleDateRangeChange}
          className="min-h-12 flex-1 justify-center text-sm lg:min-h-0 lg:flex-none"
        />

        {onAddTransaction && (
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={14} />}
            onClick={onAddTransaction}
            className="min-h-12 flex-1 px-3 lg:min-h-0 lg:flex-none"
          >
            {t('transactions.addButton')}
          </Button>
        )}
      </div>

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
