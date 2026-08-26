import { useTranslation } from 'react-i18next';
import type { DateRange } from 'react-day-picker';

import { DateRangePicker } from '#shared/ui/DateRangePicker';
import { FilterTabs, type FilterTab } from '#shared/ui/FilterTabs';

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

const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

  // przez getFullYear/getMonth/getDate jako lokalne. W strefach ujemnych granica
  const selectedRange: DateRange | undefined =
    dateFrom || dateTo
      ? {
          from: dateFrom ? new Date(dateFrom) : undefined,
          to: dateTo ? new Date(dateTo) : undefined,
        }
      : undefined;

  const handleDateRangeChange = (range: DateRange | undefined): void => {
    onDateFromChange(range?.from ? formatDateToString(range.from) : '');
    onDateToChange(range?.to ? formatDateToString(range.to) : '');
  };

  return (
    <div className="flex items-center gap-4">
      <FilterTabs tabs={tabs} activeTab={typeFilter} onTabChange={handleTabChange} />

      <DateRangePicker
        selected={selectedRange}
        onSelect={handleDateRangeChange}
        placeholder={t('import.filter.dateRange')}
      />
    </div>
  );
};
