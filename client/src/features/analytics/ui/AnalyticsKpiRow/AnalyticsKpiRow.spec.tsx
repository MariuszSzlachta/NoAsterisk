import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AnalyticsKpi } from '#features/analytics/model/types';

import { AnalyticsKpiRow } from './AnalyticsKpiRow';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const kpis: AnalyticsKpi[] = [
  { label: 'Przychód', value: '5 000,00 zł', valueTone: 'income', delta: '+25,0%', trend: 'up', invertColor: false },
  { label: 'Wydatki', value: '2 000,00 zł', valueTone: 'expense', delta: '-10,0%', trend: 'down', invertColor: true },
  { label: 'Saldo', value: '3 000,00 zł', valueTone: 'income', delta: '0,0%', trend: 'neutral' },
];

describe('AnalyticsKpiRow', () => {
  it('renders one card per KPI', () => {
    render(<AnalyticsKpiRow kpis={kpis} />);

    expect(screen.getByText('Przychód')).toBeInTheDocument();
    expect(screen.getByText('Wydatki')).toBeInTheDocument();
    expect(screen.getByText('Saldo')).toBeInTheDocument();
  });

  it('renders values', () => {
    render(<AnalyticsKpiRow kpis={kpis} />);

    expect(screen.getByText('5 000,00 zł')).toBeInTheDocument();
    expect(screen.getByText('2 000,00 zł')).toBeInTheDocument();
  });

  it('renders deltas with vs period text', () => {
    render(<AnalyticsKpiRow kpis={kpis} />);

    expect(screen.getByText(/\+25,0%.*analytics\.kpi\.vsPreviousPeriod/)).toBeInTheDocument();
  });

  it('applies text-income class for trend up (non-inverted)', () => {
    const { container } = render(<AnalyticsKpiRow kpis={[kpis[0]]} />);

    const valueEl = container.querySelector('.text-income');
    expect(valueEl).toBeInTheDocument();
  });

  it('applies text-income class for trend down with invertColor (expenses going down is good)', () => {
    const { container } = render(<AnalyticsKpiRow kpis={[kpis[1]]} />);

    // invertColor=true + trend=down → text-income
    const incomeEl = container.querySelector('.text-income');
    expect(incomeEl).toBeInTheDocument();
  });

  it('applies text-muted-foreground for neutral trend', () => {
    const { container } = render(<AnalyticsKpiRow kpis={[kpis[2]]} />);

    const neutralEl = container.querySelector('.text-muted-foreground');
    expect(neutralEl).toBeInTheDocument();
  });

  it('renders empty when no KPIs', () => {
    const { container } = render(<AnalyticsKpiRow kpis={[]} />);
    const cards = container.querySelectorAll('.p-4');
    expect(cards).toHaveLength(0);
  });

  it('keeps the KPI value tone when there is no comparison', () => {
    const { container } = render(
      <AnalyticsKpiRow
        kpis={[{
          label: 'Oszczędności',
          value: '-506,54 zł',
          valueTone: 'expense',
          trend: 'neutral',
        }]}
      />,
    );

    expect(container.querySelector('.text-expense')).toBeInTheDocument();
    expect(container.querySelector('.text-xs.font-medium')).toBeNull();
  });
});
