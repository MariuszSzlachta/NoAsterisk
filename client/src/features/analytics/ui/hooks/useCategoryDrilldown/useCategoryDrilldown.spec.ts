import { describe, expect, it, vi } from 'vitest';

import { useCategoryDrilldown } from './useCategoryDrilldown';

const query = vi.hoisted(() =>
  vi.fn(() => ({ status: 'loaded', data: 'result' })),
);

vi.mock('#features/analytics/api/useCategoryDrilldownQuery', () => ({
  useCategoryDrilldownQuery: query,
}));

describe('useCategoryDrilldown', () => {
  it('forwards category and filters to the query hook', () => {
    const filters = {
      metric: 'expenses' as const,
      period: '1m' as const,
      granularity: 'monthly' as const,
    };

    expect(useCategoryDrilldown('Food', filters)).toEqual({
      status: 'loaded',
      data: 'result',
    });
    expect(query).toHaveBeenCalledWith('Food', filters);
  });
});
