import { describe, expect, it, vi } from 'vitest';

import { useKpiWidget } from '#features/dashboard-widgets/application/hooks/useKpiWidget';

vi.mock('#features/dashboard-widgets/infrastructure/api/useKpiQuery', () => ({
  useKpiQuery: vi.fn(),
}));

import { useKpiQuery } from '#features/dashboard-widgets/infrastructure/api/useKpiQuery';

const mockUseKpiQuery = vi.mocked(useKpiQuery);

describe('useKpiWidget', () => {
  it('returns loading state when query is loading', () => {
    mockUseKpiQuery.mockReturnValue({ data: [], isLoading: true });

    const result = useKpiWidget();

    expect(result).toEqual({ status: 'loading' });
  });

  it('returns loaded state with mapped VMs when query succeeds', () => {
    mockUseKpiQuery.mockReturnValue({
      data: [{ id: 'balance' as const, label: 'Saldo', value: '100 zł', deltaPercent: '+5%', trend: 'up' as const }],
      isLoading: false,
    });

    const result = useKpiWidget();

    expect(result.status).toBe('loaded');
    if (result.status === 'loaded') {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].label).toBe('Saldo');
      expect(result.data[0].delta).toBe('+5%');
      expect(result.data[0].icon).toBeDefined();
      expect(result.data[0].iconHref).toBe('/reports/balance');
    }
  });

  it('returns loaded with fallback icon for unknown id', () => {
    mockUseKpiQuery.mockReturnValue({
      data: [{ id: 'balance' as const, label: 'Unknown', value: '0 zł' }],
      isLoading: false,
    });

    const result = useKpiWidget();

    if (result.status === 'loaded') {
      expect(result.data[0].icon).toBeDefined();
      expect(result.data[0].iconHref).toBe('/reports/balance');
    }
  });
});
