import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UseUsersTabResult } from '#features/admin/ui/hooks/useUsersTab/useUsersTab';
import { useUsersTab } from '#features/admin/ui/hooks/useUsersTab/useUsersTab';

// ─── Mock Setup ──────────────────────────────────────────────────

const mockToggleBlock = vi.fn().mockResolvedValue({ id: '2', blocked: true });
const mockDeleteUser = vi.fn().mockResolvedValue({ id: '2', deleted: true });

const MOCK_USERS = [
  { id: '1', email: 'admin@budget.pl', role: 'Superuser', createdAt: '2024-01-01', hasVault: true },
  { id: '2', email: 'user@budget.pl', role: 'Member', createdAt: '2026-07-15', hasVault: false },
  { id: '3', email: 'blocked@budget.pl', role: 'Blocked', createdAt: '2026-08-01', hasVault: true },
  { id: '4', email: 'another@budget.pl', role: 'Member', createdAt: '2026-08-10', hasVault: true },
  { id: '5', email: 'test@budget.pl', role: 'Member', createdAt: '2026-08-12', hasVault: false },
  { id: '6', email: 'dev@budget.pl', role: 'Member', createdAt: '2026-08-14', hasVault: true },
  { id: '7', email: 'manager@budget.pl', role: 'Member', createdAt: '2026-08-15', hasVault: false },
  { id: '8', email: 'analyst@budget.pl', role: 'Member', createdAt: '2026-08-16', hasVault: true },
  { id: '9', email: 'designer@budget.pl', role: 'Member', createdAt: '2026-08-17', hasVault: false },
  { id: '10', email: 'last@budget.pl', role: 'Member', createdAt: '2026-08-18', hasVault: true },
];

vi.mock('#features/admin/api/useAdminUsersQuery', () => ({
  useAdminUsersQuery: () => ({ status: 'loaded', data: { users: MOCK_USERS, total: 10 } }),
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

// ─── Integration Tests ───────────────────────────────────────────

describe('useUsersTab — integration flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('pagination', () => {
    it('paginates users with PAGE_SIZE=8', () => {
      const { result } = renderHook(() => useUsersTab());
      const data = getLoaded(result.current);

      expect(data.users).toHaveLength(8);
      expect(data.totalPages).toBe(2);
      expect(data.currentPage).toBe(1);
    });

    it('shows remaining users on page 2', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        getLoaded(result.current).handleNextPage();
      });

      const data = getLoaded(result.current);
      expect(data.currentPage).toBe(2);
      expect(data.users).toHaveLength(2);
    });

    it('prevents going below page 1', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        getLoaded(result.current).handlePrevPage();
      });

      expect(getLoaded(result.current).currentPage).toBe(1);
    });

    it('prevents going beyond last page', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        getLoaded(result.current).handleNextPage();
      });
      act(() => {
        getLoaded(result.current).handleNextPage();
      });

      expect(getLoaded(result.current).currentPage).toBe(2);
    });
  });

  describe('search + pagination interaction', () => {
    it('resets to page 1 when searching', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        getLoaded(result.current).handleNextPage();
      });
      expect(getLoaded(result.current).currentPage).toBe(2);

      act(() => {
        getLoaded(result.current).handleSearchChange({
          target: { value: 'admin' },
        } satisfies React.ChangeEvent<HTMLInputElement>);
      });

      const data = getLoaded(result.current);
      expect(data.currentPage).toBe(1);
      expect(data.users).toHaveLength(1);
    });

    it('filters case-insensitively', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        getLoaded(result.current).handleSearchChange({
          target: { value: 'ADMIN' },
        } satisfies React.ChangeEvent<HTMLInputElement>);
      });

      const data = getLoaded(result.current);
      expect(data.users).toHaveLength(1);
      expect(data.users[0].email).toBe('admin@budget.pl');
    });

    it('shows all when search is cleared', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        getLoaded(result.current).handleSearchChange({
          target: { value: 'admin' },
        } satisfies React.ChangeEvent<HTMLInputElement>);
      });
      act(() => {
        getLoaded(result.current).handleSearchChange({
          target: { value: '' },
        } satisfies React.ChangeEvent<HTMLInputElement>);
      });

      expect(getLoaded(result.current).users).toHaveLength(8);
    });
  });

  describe('block user flow', () => {
    it('calls toggleBlock mutation with correct params', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        getLoaded(result.current).handleBlock('3', false);
      });

      expect(mockToggleBlock).toHaveBeenCalledWith('3', false);
    });
  });

  describe('delete user flow', () => {
    it('full delete flow: request → confirm → mutation called', async () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        getLoaded(result.current).handleDeleteRequest(MOCK_USERS[1]);
      });
      expect(getLoaded(result.current).deleteTarget).toEqual(MOCK_USERS[1]);

      await act(async () => {
        getLoaded(result.current).handleDeleteConfirm();
      });
      expect(mockDeleteUser).toHaveBeenCalledWith('2');
      expect(getLoaded(result.current).deleteTarget).toBeUndefined();
    });

    it('full delete flow: request → cancel → no mutation', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        getLoaded(result.current).handleDeleteRequest(MOCK_USERS[1]);
      });
      act(() => {
        getLoaded(result.current).handleDeleteCancel();
      });

      expect(mockDeleteUser).not.toHaveBeenCalled();
      expect(getLoaded(result.current).deleteTarget).toBeUndefined();
    });

    it('does not call deleteUser when no target set', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        getLoaded(result.current).handleDeleteConfirm();
      });

      expect(mockDeleteUser).not.toHaveBeenCalled();
    });
  });
});
