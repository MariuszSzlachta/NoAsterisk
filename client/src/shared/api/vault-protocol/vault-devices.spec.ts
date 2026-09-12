import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '#shared/api';
import { vaultDevices } from '#shared/api/vault-protocol/vault-devices';

vi.mock('#shared/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

describe('vaultDevices', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts only allowlisted device metadata', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      {
        deviceId: 'device-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
        status: 'active',
        createdAt: '2026-09-12T00:00:00.000Z',
        lastSeenAt: '2026-09-12T00:00:00.000Z',
      },
    ]);
    await expect(vaultDevices.list()).resolves.toHaveLength(1);
    vi.mocked(apiClient.get).mockResolvedValue([
      { deviceId: 'device-1', serverShare: 'secret' },
    ]);
    await expect(vaultDevices.list()).rejects.toThrow(
      'Invalid vault devices response',
    );
  });

  it('encodes the device ID and rejects invalid identifiers', async () => {
    await vaultDevices.revoke('device/one');
    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/me/vault/devices/device%2Fone/revoke',
      {},
    );
    await expect(vaultDevices.revoke('')).rejects.toThrow('Invalid device ID');
  });
});
