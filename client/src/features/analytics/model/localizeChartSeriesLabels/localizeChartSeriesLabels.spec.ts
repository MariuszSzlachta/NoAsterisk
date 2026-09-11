import { describe, expect, it } from 'vitest';

import { localizeChartSeriesLabels } from './localizeChartSeriesLabels';

describe('localizeChartSeriesLabels', () => {
  it('localizes month keys and preserves the year suffix', () => {
    const result = localizeChartSeriesLabels(
      [{ id: 'expenses', data: [{ x: 'months.apr:26', y: 10 }] }],
      (key) => ({ 'months.apr': 'kwi' })[key] ?? key,
    );

    expect(result[0]?.data[0]?.x).toBe('kwi:26');
  });

  it('leaves non-month labels unchanged', () => {
    const result = localizeChartSeriesLabels(
      [
        {
          id: 'expenses',
          data: [
            { x: 'custom', y: 10 },
            { x: 2, y: 20 },
          ],
        },
      ],
      () => 'translated',
    );

    expect(result[0]?.data.map((point) => point.x)).toEqual(['custom', 2]);
  });
});
