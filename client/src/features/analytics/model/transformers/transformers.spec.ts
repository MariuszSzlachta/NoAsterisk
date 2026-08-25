import { describe, expect, it } from 'vitest';

import { mapBreakdownToChartData } from './transformers';

describe('mapBreakdownToChartData', () => {
  it('maps category and amount to label and value', () => {
    const items = [
      { categoryId: 'cat-groceries', category: 'Zakupy', amount: 1200, percentage: 40 },
      { categoryId: 'cat-transport', category: 'Transport', amount: 800, percentage: 27 },
    ];

    expect(mapBreakdownToChartData(items)).toEqual([
      { label: 'Zakupy', value: 1200 },
      { label: 'Transport', value: 800 },
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(mapBreakdownToChartData([])).toEqual([]);
  });
});
