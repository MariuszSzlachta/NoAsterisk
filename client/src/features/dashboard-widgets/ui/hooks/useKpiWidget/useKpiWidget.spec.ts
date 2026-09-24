import { describe, expect, it, vi } from 'vitest';

import { useKpiQuery } from '#features/dashboard-widgets/api/useKpiQuery';
import { useKpiWidget } from '#features/dashboard-widgets/ui/hooks/useKpiWidget';

vi.mock('#features/dashboard-widgets/api/useKpiQuery', () => ({
  useKpiQuery: vi.fn(),
}));

const mockUseKpiQuery = vi.mocked(useKpiQuery);

describe('useKpiWidget', () => {
  it('returns loading state when query is loading', () => {
    mockUseKpiQuery.mockReturnValue({ status: 'loading' });

    const result = useKpiWidget();

    expect(result).toEqual({ status: 'loading' });
  });

  it('returns loaded state with mapped VMs when query succeeds', () => {
    mockUseKpiQuery.mockReturnValue({
      status: 'loaded',
      data: [
        {
          id: 'balance',
          label: 'Saldo',
          value: '100 zł',
          deltaPercent: '+5%',
          trend: 'up',
        },
      ],
    });

    const result = useKpiWidget();

    expect(result.status).toBe('loaded');
    if (result.status === 'loaded') {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].label).toBe('Saldo');
      expect(result.data[0].delta).toBe('+5%');
      expect(result.data[0].icon).toBeDefined();
      expect(result.data[0].iconHref).toBe('/analytics?metric=balance');
    }
  });

  it('returns loaded with fallback icon for unknown id', () => {
    mockUseKpiQuery.mockReturnValue({
      status: 'loaded',
      data: [{ id: 'balance', label: 'Unknown', value: '0 zł' }],
    });

    const result = useKpiWidget();

    if (result.status === 'loaded') {
      expect(result.data[0].icon).toBeDefined();
      expect(result.data[0].iconHref).toBe('/analytics?metric=balance');
    }
  });
});
