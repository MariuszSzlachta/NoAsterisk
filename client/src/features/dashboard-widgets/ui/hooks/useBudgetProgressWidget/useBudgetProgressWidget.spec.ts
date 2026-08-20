import { describe, expect, it, vi } from 'vitest';

import { useBudgetQuery } from '#features/dashboard-widgets/api/useBudgetQuery';
import { useBudgetProgressWidget } from '#features/dashboard-widgets/ui/hooks/useBudgetProgressWidget';

vi.mock('#features/dashboard-widgets/api/useBudgetQuery', () => ({
  useBudgetQuery: vi.fn(),
}));

const mockQuery = vi.mocked(useBudgetQuery);

describe('useBudgetProgressWidget', () => {
  it('returns loading state when query is loading', () => {
    mockQuery.mockReturnValue({ status: 'loading' });

    const result = useBudgetProgressWidget();

    expect(result).toEqual({ status: 'loading' });
  });

  it('returns loaded state with mapped budget items', () => {
    mockQuery.mockReturnValue({
      status: 'loaded',
      data: [
        {
          label: 'Transport',
          spent: 620,
          limit: 800,
          color: 'var(--cat-transport)',
        },
      ],
    });

    const result = useBudgetProgressWidget();

    expect(result.status).toBe('loaded');
    if (result.status === 'loaded') {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        label: 'Transport',
        spent: 620,
        limit: 800,
        color: 'var(--cat-transport)',
      });
    }
  });
});
