import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AnalyticsChart } from './AnalyticsChart';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => `translated:${key}` }),
}));
vi.mock('#shared/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <section>{children}</section>
  ),
}));
vi.mock('#shared/adapters/charts', () => ({
  LineChart: ({ data, axisBottom }: { data: unknown; axisBottom: unknown }) => (
    <div
      data-testid="line-chart"
      data-series={JSON.stringify(data)}
      data-axis={JSON.stringify(axisBottom)}
    />
  ),
}));

describe('AnalyticsChart', () => {
  it('localizes month labels and passes sampled ticks to the line chart', () => {
    render(
      <AnalyticsChart
        series={[
          {
            id: 'expenses',
            data: [
              { x: 'months.january:2026', y: 10 },
              { x: 'months.february:2026', y: 20 },
            ],
          },
        ]}
      />,
    );

    const chart = screen.getByTestId('line-chart');
    expect(chart.dataset.series).toContain('translated:months.january:2026');
    expect(chart.dataset.axis).toContain('translated:months.february:2026');
    expect(
      screen.getByText('translated:analytics.metrics.expenses'),
    ).toBeInTheDocument();
  });
});
