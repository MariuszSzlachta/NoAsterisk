import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useVaultQuery } from '#features/user-settings/api/useVaultQuery';
import type { VaultResponse } from '#features/user-settings/api/useVaultQuery/vault-response';
import { decryptVaultPayload } from '#features/user-settings/model/decrypt-vault-payload';
import { VaultDecryptionError } from '#features/user-settings/model/vault-decryption-error';
import { createVaultPayload } from '#features/user-settings/model/vault-payload';
import { restoreVaultPayload } from '#features/user-settings/ui/hooks/restore-vault-payload';
import { useRestoreOnLogin } from '#features/user-settings/ui/hooks/useRestoreOnLogin';
import { useTransactionsStore } from '#entities/transaction';

vi.mock('#features/user-settings/api/useVaultQuery', () => ({
  useVaultQuery: vi.fn(),
}));

vi.mock('#features/user-settings/model/decrypt-vault-payload', () => ({
  decryptVaultPayload: vi.fn(),
}));

vi.mock('#features/user-settings/ui/hooks/restore-vault-payload', () => ({
  restoreVaultPayload: vi.fn(),
}));

const mockUseVaultQuery = vi.mocked(useVaultQuery);
const mockDecryptVaultPayload = vi.mocked(decryptVaultPayload);
const mockRestoreVaultPayload = vi.mocked(restoreVaultPayload);

const REMOTE_SNAPSHOT: Extract<VaultResponse, { status: 'available' }> = {
  status: 'available',
  encryptedBlob: 'opaque-ciphertext',
  byteSize: 20,
  revision: 3,
  contentHash: 'hash',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const EMPTY_PAYLOAD = createVaultPayload({
  transactions: [],
  rules: [],
  categories: [],
  budgets: [],
  periodHistory: [],
  importHistory: [],
});

describe('useRestoreOnLogin', () => {
  beforeEach(() => {
    useTransactionsStore.setState({ transactions: [] });
    mockUseVaultQuery.mockReturnValue({
      data: REMOTE_SNAPSHOT,
      hasRemoteSnapshot: true,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
    });
    mockDecryptVaultPayload.mockReset();
    mockRestoreVaultPayload.mockReset();
  });

  it('opens the prompt only when local transactions are empty', async () => {
    const { result } = renderHook(() => useRestoreOnLogin());

    await waitFor(() => expect(result.current.showDialog).toBe(true));

    act(() => result.current.handleDismiss());
    expect(result.current.showDialog).toBe(false);
  });

  it('does not prompt when local transactions exist', () => {
    useTransactionsStore.setState({
      transactions: [
        {
          id: 'transaction-1',
          date: '2026-01-01',
          description: 'Groceries',
          amount: -10,
          currency: 'PLN',
          contentHash: 'content-hash',
          batchId: 'batch-1',
          importedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    const { result } = renderHook(() => useRestoreOnLogin());

    expect(result.current.showDialog).toBe(false);
  });

  it('ignores restore when the remote snapshot disappears', async () => {
    mockUseVaultQuery.mockReturnValue({
      data: undefined,
      hasRemoteSnapshot: false,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useRestoreOnLogin());

    act(() => result.current.handleRestore('vault-password'));
    await waitFor(() => expect(result.current.showDialog).toBe(false));

    expect(mockDecryptVaultPayload).not.toHaveBeenCalled();
  });

  it('keeps the dialog open with a translated error after wrong password', async () => {
    mockDecryptVaultPayload.mockRejectedValue(
      new VaultDecryptionError('wrong password'),
    );
    const { result } = renderHook(() => useRestoreOnLogin());

    await waitFor(() => expect(result.current.showDialog).toBe(true));
    act(() => result.current.handleRestore('wrong-password'));
    await waitFor(() =>
      expect(result.current.error).toBe('settings.vault.wrongPassword'),
    );

    expect(result.current.showDialog).toBe(true);
    expect(result.current.error).toBe('settings.vault.wrongPassword');
    expect(result.current.isRestoring).toBe(false);
    expect(mockRestoreVaultPayload).not.toHaveBeenCalled();
  });

  it('hides the dialog after a validated remote restore', async () => {
    mockDecryptVaultPayload.mockResolvedValue(EMPTY_PAYLOAD);
    const { result } = renderHook(() => useRestoreOnLogin());

    await waitFor(() => expect(result.current.showDialog).toBe(true));
    act(() => result.current.handleRestore('vault-password'));
    await waitFor(() => expect(result.current.showDialog).toBe(false));

    expect(mockRestoreVaultPayload).toHaveBeenCalledWith(EMPTY_PAYLOAD);
    expect(result.current.showDialog).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('keeps the dialog open after an unexpected restore failure', async () => {
    mockDecryptVaultPayload.mockRejectedValue(new Error('storage failure'));
    const { result } = renderHook(() => useRestoreOnLogin());

    await waitFor(() => expect(result.current.showDialog).toBe(true));
    act(() => result.current.handleRestore('vault-password'));
    await waitFor(() =>
      expect(result.current.error).toBe('settings.vault.restoreError'),
    );

    expect(result.current.showDialog).toBe(true);
    expect(result.current.error).toBe('settings.vault.restoreError');
  });
});
