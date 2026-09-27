import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CategoryDrilldown } from './CategoryDrilldown';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('#features/analytics/ui/hooks/useCategoryDrilldown', () => ({
  useCategoryDrilldown: () => ({
    status: 'loaded',
    data: {
      trend: { id: 'Food', data: [{ x: 'months.september:2026', y: 20 }] },
      transactions: [
        { id: 'tx-1', title: 'Market', amount: 20, date: '2026-09-01' },
      ],
    },
  }),
}));
vi.mock('#shared/adapters/charts', () => ({
  LineChart: () => <div data-testid="line-chart" />,
}));

describe('CategoryDrilldown', () => {
  it('renders trend and transactions and allows closing the drilldown', () => {
    const onClose = vi.fn();
    render(
      <CategoryDrilldown
        id="food-details"
        category="Food"
        color="#123456"
        filters={{ metric: 'expenses', period: '1m', granularity: 'monthly' }}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('region', { name: 'Food' })).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByText('Market')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'analytics.drilldown.close' }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });
});
