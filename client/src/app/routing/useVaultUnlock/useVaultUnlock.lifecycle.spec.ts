import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { passkeyUnlockHandoff } from '#shared/adapters/webauthn/passkey-unlock-handoff';
import { vaultPasskeyCeremony } from '#shared/adapters/webauthn/vault-passkey-ceremony';

import { useVaultUnlock } from './useVaultUnlock';

const { bootstrapGet, unlockWithVaultKeys } = vi.hoisted(() => ({
  bootstrapGet: vi.fn(),
  unlockWithVaultKeys: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('#app/providers/hydrate-financial-stores', () => ({
  hydrateFinancialStores: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    readVaultLocalShare: vi.fn().mockResolvedValue({} satisfies CryptoKey),
    subscribe: vi.fn(() => vi.fn()),
    unlockWithVaultKeys,
    lock: vi.fn(),
  },
}));

vi.mock('#shared/adapters/vault-protocol/device-signing-key', () => ({
  deviceSigningKey: {
    generate: vi.fn(),
    exportPublicJwk: vi.fn(),
  },
}));

vi.mock('#shared/adapters/vault-protocol/recovery-code', () => ({
  recoveryCode: { restore: vi.fn(), create: vi.fn() },
}));

vi.mock('#shared/adapters/vault-protocol/recovery-qr', () => ({
  recoveryQr: { render: vi.fn() },
}));

vi.mock('#shared/adapters/vault-protocol/unlock-coordinator', () => ({
  unlockCoordinator: {
    unlock: vi.fn().mockResolvedValue({
      local: {},
      sync: {},
      check: {},
      localShare: {},
    }),
  },
}));

vi.mock('#shared/adapters/vault-protocol/vault-protocol', () => ({
  vaultProtocol: {},
}));

vi.mock('#shared/adapters/vault-protocol/vault-protocol-constants', () => ({
  vaultProtocolConstants: { maxShareLength: 32 },
}));

vi.mock('#shared/adapters/vault-protocol/vault-rotation', () => ({
  vaultRotation: { resumePending: vi.fn().mockResolvedValue(false) },
}));

vi.mock('#shared/adapters/webauthn/vault-passkey-ceremony', () => ({
  vaultPasskeyCeremony: { run: vi.fn() },
}));

vi.mock('#shared/api/vault-protocol/issue-server-share', () => ({
  issueServerShare: vi.fn().mockResolvedValue(new Uint8Array(32)),
}));

vi.mock('#shared/api/vault-protocol/vault-bootstrap', () => ({
  vaultBootstrap: { get: bootstrapGet },
}));

vi.mock('#shared/api/vault-protocol/vault-enrollment', () => ({
  vaultEnrollment: {},
}));

const snapshot = {
  status: 'locked',
  error: undefined,
  warning: undefined,
};

describe('useVaultUnlock lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    passkeyUnlockHandoff.clear();
    bootstrapGet.mockResolvedValue({
      status: 'available',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      deviceEnvelope: JSON.stringify({ header: {}, ciphertext: 'opaque' }),
    });
  });

  it('starts a fresh bootstrap after an account switch', async () => {
    const { rerender } = renderHook(
      ({ accountId }: { readonly accountId: string }) =>
        useVaultUnlock(snapshot, accountId, 'workspace-1'),
      { initialProps: { accountId: 'account-1' } },
    );

    await waitFor(() => expect(bootstrapGet).toHaveBeenCalledTimes(1));
    expect(unlockWithVaultKeys).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ accountId: 'account-1' }),
      expect.anything(),
    );

    rerender({ accountId: 'account-2' });
    await waitFor(() => expect(bootstrapGet).toHaveBeenCalledTimes(2));
    expect(unlockWithVaultKeys).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ accountId: 'account-2' }),
      expect.anything(),
    );
  });

  it('uses split unlock after password auth without showing a second PRF prompt', async () => {
    bootstrapGet.mockResolvedValue({
      status: 'available',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      deviceEnvelope: JSON.stringify({ header: {}, ciphertext: 'device' }),
      passkeyEnvelope: JSON.stringify({ header: {}, ciphertext: 'passkey' }),
    });

    renderHook(() => useVaultUnlock(snapshot, 'account-1', 'workspace-1'));
    await waitFor(() => expect(unlockWithVaultKeys).toHaveBeenCalledOnce());
    expect(vaultPasskeyCeremony.run).not.toHaveBeenCalled();
  });

  it('consumes the PRF handoff from the login ceremony without repeating it', async () => {
    const prfKey = {} satisfies CryptoKey;
    passkeyUnlockHandoff.set({
      context: {
        accountId: 'account-1',
        workspaceId: 'workspace-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
        deviceId: 'device-1',
      },
      credentialId: 'credential-1',
      prfKey,
    });
    bootstrapGet.mockResolvedValue({
      status: 'available',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      deviceEnvelope: JSON.stringify({ header: {}, ciphertext: 'device' }),
      passkeyEnvelope: JSON.stringify({ header: {}, ciphertext: 'passkey' }),
    });

    renderHook(() => useVaultUnlock(snapshot, 'account-1', 'workspace-1'));
    await waitFor(() => expect(unlockWithVaultKeys).toHaveBeenCalledOnce());
    expect(vaultPasskeyCeremony.run).not.toHaveBeenCalled();
  });
});
