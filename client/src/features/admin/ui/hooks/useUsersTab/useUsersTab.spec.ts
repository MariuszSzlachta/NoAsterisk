import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UseUsersTabResult } from './useUsersTab';
import { useUsersTab } from './useUsersTab';

// ─── Mocks ───────────────────────────────────────────────────────

const mockUsers = [
  { id: '1', email: 'admin@test.pl', role: 'Superuser', createdAt: '2024-01-01', hasVault: true },
  { id: '2', email: 'user@test.pl', role: 'Member', createdAt: '2026-08-01', hasVault: false },
  { id: '3', email: 'blocked@test.pl', role: 'Blocked', createdAt: '2026-08-03', hasVault: true },
];

const mockToggleBlock = vi.fn();
const mockDeleteUser = vi.fn().mockResolvedValue({ id: '2', deleted: true });

vi.mock('#features/admin/api/useAdminUsersQuery', () => ({
  useAdminUsersQuery: () => ({ status: 'loaded', data: { users: mockUsers, total: 3 } }),
}));

vi.mock('#features/admin/api/useBlockUserMutation', () => ({
  useBlockUserMutation: () => ({ toggleBlock: mockToggleBlock, isLoading: false, error: undefined }),
}));

vi.mock('#features/admin/api/useDeleteUserMutation', () => ({
  useDeleteUserMutation: () => ({ deleteUser: mockDeleteUser, isLoading: false, error: undefined }),
}));

// ─── Helpers ─────────────────────────────────────────────────────

const getLoaded = (result: UseUsersTabResult) => {
  if (result.status !== 'loaded') throw new Error(`Expected loaded, got ${result.status}`);
  return result;
};

// ─── Tests ───────────────────────────────────────────────────────

describe('useUsersTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all users on initial render', () => {
    const { result } = renderHook(() => useUsersTab());
    const data = getLoaded(result.current);

    expect(data.users).toHaveLength(3);
    expect(data.totalUsers).toBe(3);
    expect(data.status).toBe('loaded');
  });

  it('filters users by search query', () => {
    const { result } = renderHook(() => useUsersTab());

    act(() => {
      getLoaded(result.current).handleSearchChange({ target: { value: 'admin' } } satisfies React.ChangeEvent<HTMLInputElement>);
    });

    const data = getLoaded(result.current);
    expect(data.users).toHaveLength(1);
    expect(data.users[0].email).toBe('admin@test.pl');
  });

  it('resets page to 1 on search', () => {
    const { result } = renderHook(() => useUsersTab());

    act(() => {
      getLoaded(result.current).handleNextPage();
    });

    act(() => {
      getLoaded(result.current).handleSearchChange({ target: { value: 'test' } } satisfies React.ChangeEvent<HTMLInputElement>);
    });

    expect(getLoaded(result.current).currentPage).toBe(1);
  });

  it('sets deleteTarget on delete request', () => {
    const { result } = renderHook(() => useUsersTab());

    act(() => {
      getLoaded(result.current).handleDeleteRequest(mockUsers[1]);
    });

    expect(getLoaded(result.current).deleteTarget).toEqual(mockUsers[1]);
  });

  it('clears deleteTarget on cancel', () => {
    const { result } = renderHook(() => useUsersTab());

    act(() => {
      getLoaded(result.current).handleDeleteRequest(mockUsers[1]);
    });
    act(() => {
      getLoaded(result.current).handleDeleteCancel();
    });

    expect(getLoaded(result.current).deleteTarget).toBeUndefined();
  });

  it('calls deleteUser and clears target on confirm', async () => {
    const { result } = renderHook(() => useUsersTab());

    act(() => {
      getLoaded(result.current).handleDeleteRequest(mockUsers[1]);
    });

    await act(async () => {
      getLoaded(result.current).handleDeleteConfirm();
    });

    expect(mockDeleteUser).toHaveBeenCalledWith('2');
    expect(getLoaded(result.current).deleteTarget).toBeUndefined();
  });

  it('calls toggleBlock with correct params', () => {
    const { result } = renderHook(() => useUsersTab());

    act(() => {
      getLoaded(result.current).handleBlock('2', true);
    });

    expect(mockToggleBlock).toHaveBeenCalledWith('2', true);
  });
});
