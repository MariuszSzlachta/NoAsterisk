import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useBlockUserMutation } from '#features/admin/api/useBlockUserMutation/useBlockUserMutation';
import { useDeleteInviteCodeMutation } from '#features/admin/api/useDeleteInviteCodeMutation/useDeleteInviteCodeMutation';
import { useDeleteUserMutation } from '#features/admin/api/useDeleteUserMutation/useDeleteUserMutation';
import { useGenerateCodeMutation } from '#features/admin/api/useGenerateCodeMutation/useGenerateCodeMutation';

// ─── Mock apiClient ──────────────────────────────────────────────

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();
const mockUseApiQuery = vi.fn();

vi.mock('#shared/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
  useApiQuery: (...args: unknown[]) => mockUseApiQuery(...args),
}));

// ─── QueryClient wrapper ─────────────────────────────────────────

let queryClient: QueryClient;

const createWrapper = (): React.FC<{ children: React.ReactNode }> => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// ─── Tests ───────────────────────────────────────────────────────

describe('Admin API Mutation Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient?.clear();
  });

  describe('useBlockUserMutation', () => {
    it('calls PATCH /admin/users/:id/block with block payload', async () => {
      mockPatch.mockResolvedValue({ id: 'u-1', blocked: true });

      const { result } = renderHook(() => useBlockUserMutation(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.toggleBlock('u-1', true);
      });

      expect(mockPatch).toHaveBeenCalledWith('/admin/users/u-1/block', { block: true });
    });

    it('calls with block=false for unblock', async () => {
      mockPatch.mockResolvedValue({ id: 'u-2', blocked: false });

      const { result } = renderHook(() => useBlockUserMutation(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.toggleBlock('u-2', false);
      });

      expect(mockPatch).toHaveBeenCalledWith('/admin/users/u-2/block', { block: false });
    });

    it('invalidates admin users query on success', async () => {
      mockPatch.mockResolvedValue({ id: 'u-1', blocked: true });
      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useBlockUserMutation(), { wrapper });

      await act(async () => {
        await result.current.toggleBlock('u-1', true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'users'] });
    });
  });

  describe('useDeleteUserMutation', () => {
    it('calls DELETE /admin/users/:id', async () => {
      mockDelete.mockResolvedValue({ id: 'u-5', deleted: true });

      const { result } = renderHook(() => useDeleteUserMutation(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.deleteUser('u-5');
      });

      expect(mockDelete).toHaveBeenCalledWith('/admin/users/u-5');
    });

    it('invalidates admin users query on success', async () => {
      mockDelete.mockResolvedValue({ id: 'u-5', deleted: true });
      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteUserMutation(), { wrapper });

      await act(async () => {
        await result.current.deleteUser('u-5');
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'users'] });
    });
  });

  describe('useDeleteInviteCodeMutation', () => {
    it('calls DELETE /admin/invite-codes/:id', async () => {
      mockDelete.mockResolvedValue({ id: 'c-1', deleted: true });

      const { result } = renderHook(() => useDeleteInviteCodeMutation(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.deleteCode('c-1');
      });

      expect(mockDelete).toHaveBeenCalledWith('/admin/invite-codes/c-1');
    });

    it('invalidates invite-codes query on success', async () => {
      mockDelete.mockResolvedValue({ id: 'c-1', deleted: true });
      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteInviteCodeMutation(), { wrapper });

      await act(async () => {
        await result.current.deleteCode('c-1');
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'invite-codes'] });
    });
  });

  describe('useGenerateCodeMutation', () => {
    it('calls POST /admin/invite-codes with expiresAt', async () => {
      mockPost.mockResolvedValue({ id: 'c-new', code: 'XYZ', expiresAt: '2026-12-31' });

      const { result } = renderHook(() => useGenerateCodeMutation(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.generate('2026-12-31');
      });

      expect(mockPost).toHaveBeenCalledWith('/admin/invite-codes', { expiresAt: '2026-12-31' });
    });

    it('calls POST with empty body when no expiry', async () => {
      mockPost.mockResolvedValue({ id: 'c-new', code: 'ABC', expiresAt: undefined });

      const { result } = renderHook(() => useGenerateCodeMutation(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.generate();
      });

      expect(mockPost).toHaveBeenCalledWith('/admin/invite-codes', {});
    });

    it('invalidates invite-codes query on success', async () => {
      mockPost.mockResolvedValue({ id: 'c-new', code: 'ABC', expiresAt: undefined });
      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useGenerateCodeMutation(), { wrapper });

      await act(async () => {
        await result.current.generate();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'invite-codes'] });
    });
  });
});

describe('Admin API Query Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAdminUsersQuery', () => {
    it('passes correct queryKey to useApiQuery', async () => {
      mockUseApiQuery.mockReturnValue({ status: 'loading' });

      const { useAdminUsersQuery: hook } = await import('#features/admin/api/useAdminUsersQuery/useAdminUsersQuery');
      renderHook(() => hook(), { wrapper: createWrapper() });

      expect(mockUseApiQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['admin', 'users'],
        }),
      );
    });
  });

  describe('useInviteCodesQuery', () => {
    it('passes correct queryKey to useApiQuery', async () => {
      mockUseApiQuery.mockReturnValue({ status: 'loading' });

      const { useInviteCodesQuery: hook } = await import('#features/admin/api/useInviteCodesQuery/useInviteCodesQuery');
      renderHook(() => hook(), { wrapper: createWrapper() });

      expect(mockUseApiQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['admin', 'invite-codes'],
        }),
      );
    });
  });
});
