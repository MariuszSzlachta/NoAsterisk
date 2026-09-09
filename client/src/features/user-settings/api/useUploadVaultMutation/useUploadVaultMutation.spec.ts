import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUploadVaultMutation } from '#features/user-settings/api/useUploadVaultMutation';
import type { UploadVaultBody } from '#features/user-settings/api/useUploadVaultMutation/upload-vault-body';
import { apiClient } from '#shared/api';

vi.mock('#shared/api', async () => {
  const actual =
    await vi.importActual<typeof import('#shared/api')>('#shared/api');
  return { ...actual, apiClient: { put: vi.fn() } };
});

const mockPut = vi.mocked(apiClient.put);
const BODY: UploadVaultBody = {
  encryptedBlob: 'ciphertext',
  baseRevision: 2,
};
const RESPONSE = {
  encryptedBlob: 'ciphertext',
  byteSize: 10,
  revision: 3,
  contentHash: 'hash',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
};

describe('useUploadVaultMutation', () => {
  beforeEach(() => mockPut.mockReset());

  it('uploads ciphertext with the optimistic-lock revision', async () => {
    mockPut.mockResolvedValue(RESPONSE);
    const { result } = renderHook(() => useUploadVaultMutation());

    await act(async () => {
      await expect(result.current.mutateAsync(BODY)).resolves.toEqual(RESPONSE);
    });

    expect(mockPut).toHaveBeenCalledWith('/users/me/vault', BODY);
    expect(result.current.state).toEqual({
      isLoading: false,
      error: undefined,
    });
  });

  it('resets the mutation state', async () => {
    mockPut.mockResolvedValue(RESPONSE);
    const { result } = renderHook(() => useUploadVaultMutation());

    await act(async () => {
      await result.current.mutateAsync(BODY);
    });
    act(() => result.current.reset());

    expect(result.current.state).toEqual({
      isLoading: false,
      error: undefined,
    });
  });
});
