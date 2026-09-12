import { beforeEach, describe, expect, it, vi } from 'vitest';

import { synchronizeVault } from '#features/user-settings/api/synchronize-vault';
import type { encryptedPersistence } from '#shared/adapters/persistence';
import type { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';

const mocks = vi.hoisted(() => {
  const metadata = {
    observedRevision: 1,
    lastSuccessfulSyncRevision: 1,
    lastSuccessfulSyncAt: '2026-09-11T00:00:00.000Z',
    isDirty: true,
    highWaterEnvelopeHash: 'hash-1',
  };
  return {
    metadata,
    syncGet: vi.fn(),
    syncPut: vi.fn(),
    openEnvelope: vi.fn(),
    create: vi.fn(),
    markSynced: vi.fn(),
    subscribe: vi.fn<typeof encryptedPersistence.subscribe>(),
    isUnlocked: vi.fn(() => true),
    getGeneration: vi.fn(() => 1),
    importPublicJwk: vi.fn<typeof deviceSigningKey.importPublicJwk>(),
    requireVaultSyncMaterial:
      vi.fn<typeof encryptedPersistence.requireVaultSyncMaterial>(),
  };
});

vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    requireVaultSyncMaterial: mocks.requireVaultSyncMaterial,
    subscribe: mocks.subscribe,
    isUnlocked: mocks.isUnlocked,
    getGeneration: mocks.getGeneration,
  },
  persistenceSyncMetadata: {
    get: () => mocks.metadata,
    markSynced: mocks.markSynced,
  },
}));
vi.mock('#shared/api/vault-protocol/sync-snapshot-api', () => ({
  syncSnapshotApi: { get: mocks.syncGet, put: mocks.syncPut },
}));
vi.mock('#shared/adapters/vault-protocol/opaque-sync-snapshot', () => ({
  opaqueSyncSnapshot: {
    openEnvelope: mocks.openEnvelope,
    create: mocks.create,
  },
}));
vi.mock('#shared/adapters/vault-protocol/device-signing-key', () => ({
  deviceSigningKey: {
    exportPublicJwk: vi.fn().mockResolvedValue({
      kty: 'EC',
      crv: 'P-256',
      x: 'public-x',
      y: 'public-y',
    }),
    importPublicJwk: mocks.importPublicJwk,
  },
}));
vi.mock('#shared/api', () => ({ ApiError: class ApiError extends Error {} }));
vi.mock('#entities/transaction', () => ({
  useTransactionsStore: { getState: () => ({ transactions: [] }) },
}));
vi.mock('#entities/rule', () => ({
  useRulesStore: { getState: () => ({ rules: [] }) },
}));
vi.mock('#entities/category', () => ({
  useCategoriesStore: { getState: () => ({ categories: [] }) },
}));
vi.mock('#entities/budget', () => ({
  useBudgetsStore: { getState: () => ({ budgets: [] }) },
  usePeriodHistoryStore: { getState: () => ({ history: [] }) },
}));
vi.mock('#entities/import-batch', () => ({
  useImportHistoryStore: { getState: () => ({ history: [] }) },
}));

vi.mock('#shared/adapters/vault-protocol/assert-snapshot-binding', () => ({
  assertSnapshotBinding: vi.fn().mockResolvedValue(undefined),
}));

const remote = {
  vaultId: 'vault',
  keyId: 'key',
  deviceId: 'device',
  revision: 1,
  previousEnvelopeHash: '',
  envelopeHash: 'hash-1',
  header: JSON.stringify({
    accountId: 'account',
    workspaceId: 'workspace',
    vaultId: 'vault',
    keyId: 'key',
    deviceId: 'device',
    formatVersion: 2,
    cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
    revision: 1,
    previousEnvelopeHash: '',
    createdByDeviceId: 'device',
    createdAt: '2026-09-11T00:00:00.000Z',
    nonce: 'nonce',
  }),
  ciphertext: 'ciphertext',
  signature: 'signature',
  signingPublicKey: '{"kty":"EC","crv":"P-256","x":"public-x","y":"public-y"}',
  createdAt: '2026-09-11T00:00:00.000Z',
};

describe('synchronizeVault', () => {
  beforeEach(async () => {
    const syncKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    const pair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign', 'verify'],
    );
    mocks.requireVaultSyncMaterial.mockReturnValue({
      context: {
        accountId: 'account',
        workspaceId: 'workspace',
        vaultId: 'vault',
        keyId: 'key',
        deviceId: 'device',
      },
      syncKey,
      signingKey: pair.privateKey,
      verifyKey: pair.publicKey,
    });
    mocks.subscribe.mockReturnValue(() => undefined);
    mocks.metadata.observedRevision = 1;
    mocks.metadata.highWaterEnvelopeHash = 'hash-1';
    mocks.metadata.isDirty = true;
    mocks.syncGet.mockReset();
    mocks.syncPut.mockReset();
    mocks.importPublicJwk.mockReset().mockResolvedValue(pair.publicKey);
    mocks.openEnvelope.mockReset().mockResolvedValue('{}');
    mocks.create.mockReset().mockResolvedValue({
      envelope: {
        header: {
          ...JSON.parse(remote.header),
          revision: 2,
          previousEnvelopeHash: 'hash-1',
        },
        ciphertext: 'new-ciphertext',
        signature: 'new-signature',
      },
      state: { revision: 2, envelopeHash: 'hash-2' },
    });
    mocks.syncPut.mockResolvedValue({
      status: 'saved',
      revision: 2,
      envelopeHash: 'hash-2',
    });
  });

  it('does not write when local data is clean', async () => {
    mocks.metadata.isDirty = false;
    mocks.syncGet.mockResolvedValue({ status: 'available', snapshot: remote });

    await expect(synchronizeVault()).resolves.toEqual({
      status: 'noop',
      snapshot: remote,
    });
    expect(mocks.syncPut).not.toHaveBeenCalled();
  });

  it('refuses an automatic overwrite when the server is newer', async () => {
    mocks.syncGet.mockResolvedValue({
      status: 'available',
      snapshot: { ...remote, revision: 2, envelopeHash: 'remote-newer' },
    });

    await expect(synchronizeVault()).resolves.toMatchObject({
      status: 'conflict',
    });
    expect(mocks.openEnvelope).not.toHaveBeenCalled();
    expect(mocks.syncPut).not.toHaveBeenCalled();
  });

  it('verifies the current high-water snapshot and writes the next CAS revision', async () => {
    mocks.syncGet.mockResolvedValue({ status: 'available', snapshot: remote });

    await expect(synchronizeVault()).resolves.toMatchObject({
      status: 'saved',
      snapshot: { revision: 2, envelopeHash: 'hash-2' },
    });
    expect(mocks.importPublicJwk).toHaveBeenCalledWith(
      JSON.parse(remote.signingPublicKey),
    );
    expect(mocks.openEnvelope).toHaveBeenCalledOnce();
    expect(mocks.syncPut).toHaveBeenCalledWith(
      expect.objectContaining({ revision: 2, previousEnvelopeHash: 'hash-1' }),
      1,
      expect.any(AbortSignal),
    );
    expect(mocks.markSynced).toHaveBeenCalledWith(
      2,
      expect.any(String),
      'hash-2',
      undefined,
    );
  });

  it('aborts the network operation when the vault session is locked', async () => {
    let onSessionChange: (() => void) | undefined;
    mocks.subscribe.mockImplementationOnce((listener: () => void) => {
      onSessionChange = listener;
      return () => undefined;
    });
    mocks.syncGet.mockImplementationOnce(
      (_vaultId: string, signal?: AbortSignal) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );

    const pending = synchronizeVault();
    await vi.waitFor(() => expect(mocks.syncGet).toHaveBeenCalled());
    mocks.isUnlocked.mockReturnValueOnce(false);
    onSessionChange?.();
    await expect(pending).rejects.toThrow('aborted');
    expect(mocks.syncPut).not.toHaveBeenCalled();
  });
});
