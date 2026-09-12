import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '#shared/api';
import { syncSnapshotApi } from '#shared/api/vault-protocol/sync-snapshot-api';

vi.mock('#shared/api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const snapshot = {
  vaultId: 'vault-1',
  keyId: 'key-1',
  deviceId: 'device-1',
  revision: 1,
  previousEnvelopeHash: '',
  envelopeHash: 'hash-1',
  header: '{}',
  ciphertext: 'opaque',
  signature: 'signature',
  signingPublicKey: '{"kty":"EC","crv":"P-256","x":"public-x","y":"public-y"}',
  createdAt: '2026-09-11T00:00:00.000Z',
};

describe('syncSnapshotApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts only the server opaque snapshot contract', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ status: 'available', snapshot });
    await expect(syncSnapshotApi.get('vault-1')).resolves.toEqual({
      status: 'available',
      snapshot,
    });
    vi.mocked(apiClient.get).mockResolvedValue({ status: 'available', snapshot: { ...snapshot, plaintext: 'secret' } });
    await expect(syncSnapshotApi.get('vault-1')).rejects.toThrow();
  });

  it('sends CAS revision metadata and rejects invalid responses', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ status: 'saved', revision: 1, envelopeHash: 'hash-1' });
    await expect(syncSnapshotApi.put(snapshot, 0)).resolves.toEqual({
      status: 'saved',
      revision: 1,
      envelopeHash: 'hash-1',
    });
    expect(apiClient.put).toHaveBeenCalledWith(
      '/users/me/vault/sync/vault-1',
      snapshot,
      { headers: { 'If-Match': '0' } },
    );
    vi.mocked(apiClient.put).mockResolvedValue({ status: 'unexpected' });
    await expect(syncSnapshotApi.put(snapshot, 0)).rejects.toThrow();
  });
});
