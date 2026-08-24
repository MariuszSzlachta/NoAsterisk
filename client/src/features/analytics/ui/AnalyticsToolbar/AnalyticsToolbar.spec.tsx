import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AnalyticsFilters } from '#features/analytics/model/types';

import { AnalyticsToolbar } from './AnalyticsToolbar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockCreateToggle = vi.fn(() => vi.fn());
const mockCreatePeriod = vi.fn(() => vi.fn());
const mockCreateChartType = vi.fn(() => vi.fn());
const mockCreateGranularity = vi.fn(() => vi.fn());

vi.mock('#features/analytics/ui/hooks/useAnalyticsToolbar', () => ({
  useAnalyticsToolbar: () => ({
    createToggleMetricHandler: mockCreateToggle,
    createSetPeriodHandler: mockCreatePeriod,
    createSetChartTypeHandler: mockCreateChartType,
    createSetGranularityHandler: mockCreateGranularity,
  }),
}));

const baseFilters: AnalyticsFilters = {
  metrics: ['expenses', 'income'],
  period: '6m',
  chartType: 'line',
  granularity: 'monthly',
};

describe('AnalyticsToolbar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders 4 metric buttons', () => {
    render(<AnalyticsToolbar filters={baseFilters} onFiltersChange={vi.fn()} />);

    const metricsGroup = screen.getByRole('group', { name: 'Metryki' });
    const buttons = metricsGroup.querySelectorAll('button');
    expect(buttons).toHaveLength(4);
  });

  it('marks active metrics as pressed', () => {
    render(<AnalyticsToolbar filters={baseFilters} onFiltersChange={vi.fn()} />);

    const expensesBtn = screen.getByRole('button', { name: 'analytics.metrics.expenses' });
    const incomeBtn = screen.getByRole('button', { name: 'analytics.metrics.income' });
    const balanceBtn = screen.getByRole('button', { name: 'analytics.metrics.balance' });

    expect(expensesBtn).toHaveAttribute('aria-pressed', 'true');
    expect(incomeBtn).toHaveAttribute('aria-pressed', 'true');
    expect(balanceBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders 3 chart type buttons', () => {
    render(<AnalyticsToolbar filters={baseFilters} onFiltersChange={vi.fn()} />);

    const chartGroup = screen.getByRole('group', { name: 'Typ wykresu' });
    const buttons = chartGroup.querySelectorAll('button');
    expect(buttons).toHaveLength(3);
  });

  it('marks active chart type as pressed', () => {
    render(<AnalyticsToolbar filters={baseFilters} onFiltersChange={vi.fn()} />);

    const lineBtn = screen.getByRole('button', { name: 'analytics.chartTypes.line' });
    expect(lineBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders 5 period buttons', () => {
    render(<AnalyticsToolbar filters={baseFilters} onFiltersChange={vi.fn()} />);

    const periodGroup = screen.getByRole('group', { name: 'Okres' });
    const buttons = periodGroup.querySelectorAll('button');
    expect(buttons).toHaveLength(5);
  });

  it('renders 3 granularity buttons', () => {
    render(<AnalyticsToolbar filters={baseFilters} onFiltersChange={vi.fn()} />);

    const granGroup = screen.getByRole('group', { name: 'Granularność' });
    const buttons = granGroup.querySelectorAll('button');
    expect(buttons).toHaveLength(3);
  });

  it('calls createToggleMetricHandler on metric button click', () => {
    const handler = vi.fn();
    mockCreateToggle.mockReturnValue(handler);

    render(<AnalyticsToolbar filters={baseFilters} onFiltersChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'analytics.metrics.balance' }));

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
