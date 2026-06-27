import { describe, expect, it, vi } from 'vitest';

import { useRecentTransactionsWidget } from '#features/dashboard-widgets/application/hooks/useRecentTransactionsWidget';

vi.mock('#features/dashboard-widgets/infrastructure/api/useRecentTransactionsQuery', () => ({
  useRecentTransactionsQuery: vi.fn(),
}));

import { useRecentTransactionsQuery } from '#features/dashboard-widgets/infrastructure/api/useRecentTransactionsQuery';

const mockQuery = vi.mocked(useRecentTransactionsQuery);

describe('useRecentTransactionsWidget', () => {
  it('returns loading state when query is loading', () => {
    mockQuery.mockReturnValue({ data: [], isLoading: true });

    const result = useRecentTransactionsWidget();

    expect(result).toEqual({ status: 'loading' });
  });

  it('returns loaded state with mapped transactions', () => {
    mockQuery.mockReturnValue({
      data: [{ id: '1', merchant: 'SHOP', category: 'Zakupy', date: '27 cze', amount: '−50 zł', direction: 'expense' as const }],
      isLoading: false,
    });

    const result = useRecentTransactionsWidget();

    expect(result.status).toBe('loaded');
    if (result.status === 'loaded') {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].merchant).toBe('SHOP');
      expect(result.data[0].direction).toBe('expense');
    }
  });
});
