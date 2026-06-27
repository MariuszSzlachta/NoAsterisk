import { describe, expect, it, vi } from 'vitest';

import { useBudgetProgressWidget } from '#features/dashboard-widgets/application/hooks/useBudgetProgressWidget';

vi.mock('#features/dashboard-widgets/infrastructure/api/useBudgetQuery', () => ({
  useBudgetQuery: vi.fn(),
}));

import { useBudgetQuery } from '#features/dashboard-widgets/infrastructure/api/useBudgetQuery';

const mockQuery = vi.mocked(useBudgetQuery);

describe('useBudgetProgressWidget', () => {
  it('returns loading state when query is loading', () => {
    mockQuery.mockReturnValue({ data: [], isLoading: true });

    const result = useBudgetProgressWidget();

    expect(result).toEqual({ status: 'loading' });
  });

  it('returns loaded state with mapped budget items', () => {
    mockQuery.mockReturnValue({
      data: [{ label: 'Transport', spent: 620, limit: 800, color: 'var(--cat-transport)' }],
      isLoading: false,
    });

    const result = useBudgetProgressWidget();

    expect(result.status).toBe('loaded');
    if (result.status === 'loaded') {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({ label: 'Transport', spent: 620, limit: 800, color: 'var(--cat-transport)' });
    }
  });
});
