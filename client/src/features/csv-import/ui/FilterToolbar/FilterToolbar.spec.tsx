import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FilterToolbar } from './FilterToolbar';

// ─── Mocks ───────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'import.filter.all': 'Wszystkie',
        'import.filter.income': 'Przychody',
        'import.filter.expense': 'Wydatki',
        'import.filter.dateRange': 'Zakres dat',
      };
      return map[key] ?? key;
    },
  }),
}));

// Mock DateRangePicker — mirrors real component's contract:
// - `placeholder` rendered when no selection
// - `selected` = { from?: Date; to?: Date } displayed when present
// - `onSelect(range | undefined)` called on user action (apply/clear)
vi.mock('#shared/ui/DateRangePicker', () => ({
  DateRangePicker: ({
    placeholder,
    onSelect,
    selected,
  }: {
    placeholder?: string;
    onSelect: (range: unknown) => void;
    selected?: { from?: Date; to?: Date };
  }) => (
    <div data-testid="date-range-picker">
      <span>{placeholder}</span>
      {selected?.from && (
        <span data-testid="date-from">{selected.from.toISOString()}</span>
      )}
      {selected?.to && (
        <span data-testid="date-to">{selected.to.toISOString()}</span>
      )}
      <button
        type="button"
        data-testid="apply-range"
        onClick={() =>
          onSelect({ from: new Date('2026-03-01'), to: new Date('2026-03-31') })
        }
      >
        Apply
      </button>
      <button
        type="button"
        data-testid="clear-range"
        onClick={() => onSelect(undefined)}
      >
        Clear
      </button>
    </div>
  ),
}));

// ─── Default Props ───────────────────────────────────────────────

const defaultProps = {
  typeFilter: 'all' as const,
  dateFrom: '',
  dateTo: '',
  onTypeChange: vi.fn(),
  onDateFromChange: vi.fn(),
  onDateToChange: vi.fn(),
  incomeCount: 10,
  expenseCount: 25,
  totalCount: 35,
};

// ─── Tests ───────────────────────────────────────────────────────

describe('FilterToolbar', () => {
  it('renders filter tabs with counts', () => {
    render(<FilterToolbar {...defaultProps} />);

    expect(screen.getByText('Wszystkie')).toBeInTheDocument();
    expect(screen.getByText('Przychody')).toBeInTheDocument();
    expect(screen.getByText('Wydatki')).toBeInTheDocument();
  });

  it('renders DateRangePicker with placeholder', () => {
    render(<FilterToolbar {...defaultProps} />);

    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
    expect(screen.getByText('Zakres dat')).toBeInTheDocument();
  });

  it('calls onTypeChange when tab is clicked', async () => {
    const user = userEvent.setup();
    const onTypeChange = vi.fn();

    render(<FilterToolbar {...defaultProps} onTypeChange={onTypeChange} />);

    await user.click(screen.getByText('Przychody'));

    expect(onTypeChange).toHaveBeenCalledWith('income');
  });

  it('calls onDateFromChange and onDateToChange when date range is selected', async () => {
    const user = userEvent.setup();
    const onDateFromChange = vi.fn();
    const onDateToChange = vi.fn();

    render(
      <FilterToolbar
        {...defaultProps}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
      />,
    );

    await user.click(screen.getByTestId('apply-range'));

    expect(onDateFromChange).toHaveBeenCalledWith('2026-03-01');
    expect(onDateToChange).toHaveBeenCalledWith('2026-03-31');
  });

  it('calls with empty strings when date range is cleared', async () => {
    const user = userEvent.setup();
    const onDateFromChange = vi.fn();
    const onDateToChange = vi.fn();

    render(
      <FilterToolbar
        {...defaultProps}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
      />,
    );

    await user.click(screen.getByTestId('clear-range'));

    expect(onDateFromChange).toHaveBeenCalledWith('');
    expect(onDateToChange).toHaveBeenCalledWith('');
  });

  it('passes selected date range to DateRangePicker when dates are set', () => {
    render(
      <FilterToolbar
        {...defaultProps}
        dateFrom="2026-05-01"
        dateTo="2026-05-31"
      />,
    );

    expect(screen.getByTestId('date-from')).toBeInTheDocument();
    expect(screen.getByTestId('date-to')).toBeInTheDocument();
  });

  it('does not pass selected range when dates are empty', () => {
    render(<FilterToolbar {...defaultProps} />);

    expect(screen.queryByTestId('date-from')).not.toBeInTheDocument();
    expect(screen.queryByTestId('date-to')).not.toBeInTheDocument();
  });
});
