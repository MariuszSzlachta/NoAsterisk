import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUsersTab } from '#features/admin/ui/hooks/useUsersTab/useUsersTab';

// ─── Mock Setup ──────────────────────────────────────────────────

const mockToggleBlock = vi.fn().mockResolvedValue({ id: '2', blocked: true });
const mockDeleteUser = vi.fn().mockResolvedValue({ id: '2', deleted: true });

const MOCK_USERS = [
  { id: '1', email: 'admin@budget.pl', role: 'Superuser' as const, createdAt: '2024-01-01', hasVault: true },
  { id: '2', email: 'user@budget.pl', role: 'Member' as const, createdAt: '2026-07-15', hasVault: false },
  { id: '3', email: 'blocked@budget.pl', role: 'Blocked' as const, createdAt: '2026-08-01', hasVault: true },
  { id: '4', email: 'another@budget.pl', role: 'Member' as const, createdAt: '2026-08-10', hasVault: true },
  { id: '5', email: 'test@budget.pl', role: 'Member' as const, createdAt: '2026-08-12', hasVault: false },
  { id: '6', email: 'dev@budget.pl', role: 'Member' as const, createdAt: '2026-08-14', hasVault: true },
  { id: '7', email: 'manager@budget.pl', role: 'Member' as const, createdAt: '2026-08-15', hasVault: false },
  { id: '8', email: 'analyst@budget.pl', role: 'Member' as const, createdAt: '2026-08-16', hasVault: true },
  { id: '9', email: 'designer@budget.pl', role: 'Member' as const, createdAt: '2026-08-17', hasVault: false },
  { id: '10', email: 'last@budget.pl', role: 'Member' as const, createdAt: '2026-08-18', hasVault: true },
];

vi.mock('#features/admin', () => ({
  useAdminUsersQuery: () => ({ status: 'loaded', data: { users: MOCK_USERS, total: 10 } }),
  useBlockUserMutation: () => ({ toggleBlock: mockToggleBlock, isLoading: false }),
  useDeleteUserMutation: () => ({ deleteUser: mockDeleteUser, isLoading: false }),
}));

// ─── Integration Tests ───────────────────────────────────────────

describe('useUsersTab — integration flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('pagination', () => {
    it('paginates users with PAGE_SIZE=8', () => {
      const { result } = renderHook(() => useUsersTab());

      expect(result.current.users).toHaveLength(8);
      expect(result.current.totalPages).toBe(2);
      expect(result.current.currentPage).toBe(1);
    });

    it('shows remaining users on page 2', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        result.current.handleNextPage();
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.users).toHaveLength(2);
    });

    it('prevents going below page 1', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        result.current.handlePrevPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('prevents going beyond last page', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        result.current.handleNextPage();
      });
      act(() => {
        result.current.handleNextPage();
      });

      expect(result.current.currentPage).toBe(2);
    });
  });

  describe('search + pagination interaction', () => {
    it('resets to page 1 when searching', () => {
      const { result } = renderHook(() => useUsersTab());

      // Navigate to page 2
      act(() => {
        result.current.handleNextPage();
      });
      expect(result.current.currentPage).toBe(2);

      // Search — should reset to page 1
      act(() => {
        result.current.handleSearchChange({
          target: { value: 'admin' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.currentPage).toBe(1);
      expect(result.current.users).toHaveLength(1);
    });

    it('filters case-insensitively', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        result.current.handleSearchChange({
          target: { value: 'ADMIN' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.users).toHaveLength(1);
      expect(result.current.users[0].email).toBe('admin@budget.pl');
    });

    it('shows all when search is cleared', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        result.current.handleSearchChange({
          target: { value: 'admin' },
        } as React.ChangeEvent<HTMLInputElement>);
      });
      act(() => {
        result.current.handleSearchChange({
          target: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.users).toHaveLength(8); // page 1 of 10
    });
  });

  describe('block user flow', () => {
    it('calls toggleBlock mutation with correct params', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        result.current.handleBlock('3', false);
      });

      expect(mockToggleBlock).toHaveBeenCalledWith('3', false);
    });
  });

  describe('delete user flow', () => {
    it('full delete flow: request → confirm → mutation called', () => {
      const { result } = renderHook(() => useUsersTab());

      // Step 1: Request delete
      act(() => {
        result.current.handleDeleteRequest(MOCK_USERS[1]);
      });
      expect(result.current.deleteTarget).toEqual(MOCK_USERS[1]);

      // Step 2: Confirm
      act(() => {
        result.current.handleDeleteConfirm();
      });
      expect(mockDeleteUser).toHaveBeenCalledWith('2');
      expect(result.current.deleteTarget).toBeUndefined();
    });

    it('full delete flow: request → cancel → no mutation', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        result.current.handleDeleteRequest(MOCK_USERS[1]);
      });
      act(() => {
        result.current.handleDeleteCancel();
      });

      expect(mockDeleteUser).not.toHaveBeenCalled();
      expect(result.current.deleteTarget).toBeUndefined();
    });

    it('does not call deleteUser when no target set', () => {
      const { result } = renderHook(() => useUsersTab());

      act(() => {
        result.current.handleDeleteConfirm();
      });

      expect(mockDeleteUser).not.toHaveBeenCalled();
    });
  });
});
