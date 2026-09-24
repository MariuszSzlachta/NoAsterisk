import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAdminDashboard } from './useAdminDashboard';

// ─── Mocks ───────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const MOCK_USERS = [
  { id: '1', email: 'admin@test.pl', role: 'Superuser', createdAt: '2024-01-01', hasVault: true },
  { id: '2', email: 'user@test.pl', role: 'Member', createdAt: '2026-08-01', hasVault: false },
  { id: '3', email: 'blocked@test.pl', role: 'Blocked', createdAt: '2026-08-03', hasVault: true },
];

const MOCK_CODES = [
  { id: 'c1', code: 'ABC', status: 'Available', createdAt: '2026-08-01', expiresAt: null, usedBy: null, usedAt: null },
  { id: 'c2', code: 'DEF', status: 'Used', createdAt: '2026-08-02', expiresAt: null, usedBy: 'x@x.pl', usedAt: '2026-08-03' },
  { id: 'c3', code: 'GHI', status: 'Available', createdAt: '2026-08-04', expiresAt: null, usedBy: null, usedAt: null },
];

vi.mock('#features/admin/api/useAdminUsersQuery', () => ({
  useAdminUsersQuery: () => ({ status: 'loaded', data: { users: MOCK_USERS, total: 3 } }),
}));

vi.mock('#features/admin/api/useInviteCodesQuery', () => ({
  useInviteCodesQuery: () => ({ status: 'loaded', data: { codes: MOCK_CODES, total: 3 } }),
}));

// ─── Helpers ─────────────────────────────────────────────────────

const getLoaded = (result: ReturnType<typeof useAdminDashboard>) => {
  if (result.status !== 'loaded') throw new Error(`Expected loaded, got ${result.status}`);
  return result;
};

// ─── Tests ───────────────────────────────────────────────────────

describe('useAdminDashboard', () => {
  it('returns loaded status when both queries succeed', () => {
    const { result } = renderHook(() => useAdminDashboard());

    expect(result.current.status).toBe('loaded');
  });

  it('computes totalUsers from users array length', () => {
    const { result } = renderHook(() => useAdminDashboard());
    const data = getLoaded(result.current);

    expect(data.stats.totalUsers).toBe(3);
  });

  it('computes activeToday as non-blocked users', () => {
    const { result } = renderHook(() => useAdminDashboard());
    const data = getLoaded(result.current);

    expect(data.stats.activeToday).toBe(2);
  });

  it('computes blockedCount correctly', () => {
    const { result } = renderHook(() => useAdminDashboard());
    const data = getLoaded(result.current);

    expect(data.stats.blockedCount).toBe(1);
  });

  it('computes availableCodes from codes with Available status', () => {
    const { result } = renderHook(() => useAdminDashboard());
    const data = getLoaded(result.current);

    expect(data.stats.availableCodes).toBe(2);
  });

  it('computes usedCodes from codes with Used status', () => {
    const { result } = renderHook(() => useAdminDashboard());
    const data = getLoaded(result.current);

    expect(data.stats.usedCodes).toBe(1);
  });

  it('returns first 5 users as recentUsers', () => {
    const { result } = renderHook(() => useAdminDashboard());
    const data = getLoaded(result.current);

    expect(data.recentUsers).toHaveLength(3);
    expect(data.recentUsers[0]?.id).toBe('1');
  });

  it('returns first 5 codes as recentCodes with null mapped to undefined', () => {
    const { result } = renderHook(() => useAdminDashboard());
    const data = getLoaded(result.current);

    expect(data.recentCodes).toHaveLength(3);
    expect(data.recentCodes[0]?.expiresAt).toBeUndefined();
    expect(data.recentCodes[0]?.usedBy).toBeUndefined();
  });

  it('returns dictionary items with translated labels', () => {
    const { result } = renderHook(() => useAdminDashboard());
    const data = getLoaded(result.current);

    expect(data.dictionaryItems).toHaveLength(5);
    expect(data.dictionaryItems[0]?.label).toBe('admin.dictTypes.firstNames');
  });
});
