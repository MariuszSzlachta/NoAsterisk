import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AnalyticsFilterControls } from './AnalyticsFilterControls';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const filters = {
  metrics: ['expenses'] as const,
  period: '6m' as const,
  chartType: 'line' as const,
  granularity: 'monthly' as const,
};

describe('AnalyticsFilterControls', () => {
  it('renders mobile controls and emits a selected period', () => {
    const onFiltersChange = vi.fn();
    render(
      <AnalyticsFilterControls
        filters={{ ...filters, metrics: ['expenses'] }}
        onFiltersChange={onFiltersChange}
        variant="mobile"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'analytics.metrics.expenses' }),
    ).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(
      screen.getByRole('button', { name: 'analytics.periods.3m' }),
    );
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...filters,
      metrics: ['expenses'],
      period: '3m',
    });
  });
});
