import { describe, expect, it, vi } from 'vitest';

import { useRecentTransactionsQuery } from '#features/dashboard-widgets/api/useRecentTransactionsQuery';
import { useRecentTransactionsWidget } from '#features/dashboard-widgets/ui/hooks/useRecentTransactionsWidget';

vi.mock('#features/dashboard-widgets/api/useRecentTransactionsQuery', () => ({
  useRecentTransactionsQuery: vi.fn(),
}));

const mockQuery = vi.mocked(useRecentTransactionsQuery);

describe('useRecentTransactionsWidget', () => {
  it('returns loading state when query is loading', () => {
    mockQuery.mockReturnValue({ status: 'loading' });

    const result = useRecentTransactionsWidget();

    expect(result).toEqual({ status: 'loading' });
  });

  it('returns loaded state with mapped transactions', () => {
    mockQuery.mockReturnValue({
      status: 'loaded',
      data: [
        {
          id: '1',
          merchant: 'SHOP',
          category: 'Zakupy',
          date: '27 cze',
          amount: '−50 zł',
          direction: 'expense' as const,
        },
      ],
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
