import { useTranslation } from 'react-i18next';

import { FilterTabs, type FilterTab } from '#shared/ui/FilterTabs';
import { Input } from '#shared/ui/Input';

import type { TransactionTypeFilter } from '#features/csv-import/ui/hooks/usePreviewFilters';

interface FilterToolbarProps {
  readonly typeFilter: TransactionTypeFilter;
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly onTypeChange: (type: TransactionTypeFilter) => void;
  readonly onDateFromChange: (date: string) => void;
  readonly onDateToChange: (date: string) => void;
  readonly incomeCount: number;
  readonly expenseCount: number;
  readonly totalCount: number;
}

export const FilterToolbar = ({
  typeFilter,
  dateFrom,
  dateTo,
  onTypeChange,
  onDateFromChange,
  onDateToChange,
  incomeCount,
  expenseCount,
  totalCount,
}: FilterToolbarProps): React.JSX.Element => {
  const { t } = useTranslation();

  const tabs: FilterTab[] = [
    { id: 'all', label: t('import.filter.all'), count: totalCount },
    { id: 'income', label: t('import.filter.income'), count: incomeCount },
    { id: 'expense', label: t('import.filter.expense'), count: expenseCount },
  ];

  const handleTabChange = (id: string): void => {
    onTypeChange(id as TransactionTypeFilter);
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onDateFromChange(e.target.value);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onDateToChange(e.target.value);
  };

  return (
    <div className="flex items-center gap-4">
      <FilterTabs tabs={tabs} activeTab={typeFilter} onTabChange={handleTabChange} />

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={dateFrom}
          onChange={handleDateFromChange}
          className="h-8 w-32 text-xs"
          aria-label={t('import.filter.dateFrom')}
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="date"
          value={dateTo}
          onChange={handleDateToChange}
          className="h-8 w-32 text-xs"
          aria-label={t('import.filter.dateTo')}
        />
      </div>
    </div>
  );
};
