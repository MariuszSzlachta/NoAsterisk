import { Search } from 'lucide-react';

import { DateRangePicker } from '#shared/ui/DateRangePicker';
import { FilterTabs } from '#shared/ui/FilterTabs';
import { Input } from '#shared/ui/Input';

import { useTransactionToolbar } from '../hooks/useTransactionToolbar';

// ─── Constants ───────────────────────────────────────────────────

const TYPE_TABS = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'income', label: 'Przychody' },
  { id: 'expense', label: 'Wydatki' },
] as const;

// ─── Component ───────────────────────────────────────────────────

export const TransactionToolbar = (): React.JSX.Element => {
  const {
    searchValue,
    activeTypeTab,
    dateRange,
    handleSearchInputChange,
    handleTypeTabChange,
    handleDateRangeChange,
  } = useTransactionToolbar();

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="w-64">
        <Input
          placeholder="Filtruj transakcje…"
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
    </div>
  );
};
