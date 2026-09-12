import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '#shared/api';
import { vaultDeviceId } from '#shared/api/vault-protocol/device-id';
import { getVaultBootstrap } from '#shared/api/vault-protocol/get-vault-bootstrap';

vi.mock('#shared/api', () => ({ apiClient: { get: vi.fn() } }));
vi.mock('#shared/api/vault-protocol/device-id', () => ({
  vaultDeviceId: { get: vi.fn(() => 'device-1') },
}));

describe('vaultBootstrap', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests and validates status-only bootstrap metadata', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      status: 'enrollment-required',
      deviceId: 'device-1',
      protocolVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
    });
    await expect(getVaultBootstrap()).resolves.toMatchObject({
      status: 'enrollment-required',
    });
    expect(vaultDeviceId.get).toHaveBeenCalled();
  });

  it('rejects a bootstrap response bound to another device', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      status: 'available',
      deviceId: 'other-device',
      vaultId: 'vault-1',
      keyId: 'key-1',
      protocolVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      deviceEnvelope: 'opaque',
    });
    await expect(getVaultBootstrap()).rejects.toThrow();
  });
});
