import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUsersTab } from './useUsersTab';

// ─── Mocks ───────────────────────────────────────────────────────

const mockUsers = [
  { id: '1', email: 'admin@test.pl', role: 'Superuser' as const, createdAt: '2024-01-01', hasVault: true },
  { id: '2', email: 'user@test.pl', role: 'Member' as const, createdAt: '2026-08-01', hasVault: false },
  { id: '3', email: 'blocked@test.pl', role: 'Blocked' as const, createdAt: '2026-08-03', hasVault: true },
];

const mockToggleBlock = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock('#features/admin', () => ({
  useAdminUsersQuery: () => ({ status: 'loaded', data: { users: mockUsers, total: 3 } }),
  useBlockUserMutation: () => ({ toggleBlock: mockToggleBlock, isLoading: false }),
  useDeleteUserMutation: () => ({ deleteUser: mockDeleteUser, isLoading: false }),
}));

// ─── Tests ───────────────────────────────────────────────────────

describe('useUsersTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all users on initial render', () => {
    const { result } = renderHook(() => useUsersTab());

    expect(result.current.users).toHaveLength(3);
    expect(result.current.totalUsers).toBe(3);
    expect(result.current.isLoading).toBe(false);
  });

  it('filters users by search query', () => {
    const { result } = renderHook(() => useUsersTab());

    act(() => {
      result.current.handleSearchChange({ target: { value: 'admin' } } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0].email).toBe('admin@test.pl');
  });

  it('resets page to 1 on search', () => {
    const { result } = renderHook(() => useUsersTab());

    act(() => {
      result.current.handleNextPage();
    });

    act(() => {
      result.current.handleSearchChange({ target: { value: 'test' } } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('sets deleteTarget on delete request', () => {
    const { result } = renderHook(() => useUsersTab());

    act(() => {
      result.current.handleDeleteRequest(mockUsers[1]);
    });

    expect(result.current.deleteTarget).toEqual(mockUsers[1]);
  });

  it('clears deleteTarget on cancel', () => {
    const { result } = renderHook(() => useUsersTab());

    act(() => {
      result.current.handleDeleteRequest(mockUsers[1]);
    });
    act(() => {
      result.current.handleDeleteCancel();
    });

    expect(result.current.deleteTarget).toBeUndefined();
  });

  it('calls deleteUser and clears target on confirm', () => {
    const { result } = renderHook(() => useUsersTab());

    act(() => {
      result.current.handleDeleteRequest(mockUsers[1]);
    });
    act(() => {
      result.current.handleDeleteConfirm();
    });

    expect(mockDeleteUser).toHaveBeenCalledWith('2');
    expect(result.current.deleteTarget).toBeUndefined();
  });

  it('calls toggleBlock with correct params', () => {
    const { result } = renderHook(() => useUsersTab());

    act(() => {
      result.current.handleBlock('2', true);
    });

    expect(mockToggleBlock).toHaveBeenCalledWith('2', true);
  });
});
