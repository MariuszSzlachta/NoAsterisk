import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAdminDashboard } from './useAdminDashboard';

// ─── Mocks ───────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const MOCK_USERS = [
  { id: '1', email: 'admin@test.pl', role: 'Superuser' as const, createdAt: '2024-01-01', hasVault: true },
  { id: '2', email: 'user@test.pl', role: 'Member' as const, createdAt: '2026-08-01', hasVault: false },
  { id: '3', email: 'blocked@test.pl', role: 'Blocked' as const, createdAt: '2026-08-03', hasVault: true },
];

const MOCK_CODES = [
  { id: 'c1', code: 'ABC', status: 'Available' as const, createdAt: '2026-08-01', expiresAt: null, usedBy: null, usedAt: null },
  { id: 'c2', code: 'DEF', status: 'Used' as const, createdAt: '2026-08-02', expiresAt: null, usedBy: 'x@x.pl', usedAt: '2026-08-03' },
  { id: 'c3', code: 'GHI', status: 'Available' as const, createdAt: '2026-08-04', expiresAt: null, usedBy: null, usedAt: null },
];

vi.mock('#features/admin', () => ({
  useAdminUsersQuery: () => ({ status: 'loaded', data: { users: MOCK_USERS, total: 3 } }),
  useInviteCodesQuery: () => ({ status: 'loaded', data: { codes: MOCK_CODES, total: 3 } }),
}));

// ─── Tests ───────────────────────────────────────────────────────

describe('useAdminDashboard', () => {
  it('returns isLoading false when both queries loaded', () => {
    const { result } = renderHook(() => useAdminDashboard());

    expect(result.current.isLoading).toBe(false);
  });

  it('computes totalUsers from users array length', () => {
    const { result } = renderHook(() => useAdminDashboard());

    expect(result.current.stats.totalUsers).toBe(3);
  });

  it('computes activeToday as non-blocked users', () => {
    const { result } = renderHook(() => useAdminDashboard());

    expect(result.current.stats.activeToday).toBe(2); // Superuser + Member
  });

  it('computes blockedCount correctly', () => {
    const { result } = renderHook(() => useAdminDashboard());

    expect(result.current.stats.blockedCount).toBe(1);
  });

  it('computes availableCodes from codes with Available status', () => {
    const { result } = renderHook(() => useAdminDashboard());

    expect(result.current.stats.availableCodes).toBe(2);
  });

  it('computes usedCodes from codes with Used status', () => {
    const { result } = renderHook(() => useAdminDashboard());

    expect(result.current.stats.usedCodes).toBe(1);
  });

  it('returns first 5 users as recentUsers', () => {
    const { result } = renderHook(() => useAdminDashboard());

    expect(result.current.recentUsers).toHaveLength(3); // only 3 total
    expect(result.current.recentUsers[0].id).toBe('1');
  });

  it('returns first 5 codes as recentCodes', () => {
    const { result } = renderHook(() => useAdminDashboard());

    expect(result.current.recentCodes).toHaveLength(3);
  });

  it('returns dictionary items with translated labels', () => {
    const { result } = renderHook(() => useAdminDashboard());

    expect(result.current.dictionaryItems).toHaveLength(5);
    expect(result.current.dictionaryItems[0].label).toBe('admin.dictTypes.firstNames');
  });
});
