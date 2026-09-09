import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useVaultQuery } from '#features/user-settings/api/useVaultQuery';
import type { VaultResponse } from '#features/user-settings/api/useVaultQuery/vault-response';
import { persistenceSyncMetadata } from '#shared/adapters/persistence';
import { apiClient, ApiError } from '#shared/api';

vi.mock('#shared/api', async () => {
  const actual =
    await vi.importActual<typeof import('#shared/api')>('#shared/api');
  return { ...actual, apiClient: { get: vi.fn() } };
});

vi.mock('#shared/adapters/persistence', () => ({
  persistenceSyncMetadata: { rememberRevision: vi.fn() },
}));

const mockGet = vi.mocked(apiClient.get);
const mockRememberRevision = vi.mocked(
  persistenceSyncMetadata.rememberRevision,
);

const AVAILABLE_VAULT: VaultResponse = {
  status: 'available',
  encryptedBlob: 'ciphertext',
  byteSize: 10,
  revision: 4,
  contentHash: 'hash',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
};

describe('useVaultQuery', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockRememberRevision.mockReset();
  });

  it('returns the remote snapshot and remembers its revision', async () => {
    mockGet.mockResolvedValue(AVAILABLE_VAULT);
    const { result } = renderHook(() => useVaultQuery());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(AVAILABLE_VAULT);
    expect(result.current.hasRemoteSnapshot).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(mockRememberRevision).toHaveBeenCalledWith(4);
  });

  it('treats an empty vault as no remote snapshot', async () => {
    mockGet.mockResolvedValue({ status: 'empty' });
    const { result } = renderHook(() => useVaultQuery());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual({ status: 'empty' });
    expect(result.current.hasRemoteSnapshot).toBe(false);
    expect(mockRememberRevision).toHaveBeenCalledWith(0);
  });

  it('clears the snapshot after a not-found response', async () => {
    mockGet.mockRejectedValue(new ApiError('not found', 404));
    const { result } = renderHook(() => useVaultQuery());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('keeps the original technical error for the UI layer', async () => {
    const error = new Error('network failure');
    mockGet.mockRejectedValue(error);
    const { result } = renderHook(() => useVaultQuery());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe(error);
  });
});
