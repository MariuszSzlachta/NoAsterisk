import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '#shared/api';

import { rotateVault } from './rotate-vault';

vi.mock('#shared/api', () => ({ apiClient: { post: vi.fn() } }));

const input = {
  vaultId: 'vault-1',
  deviceId: 'device-1',
  currentKeyId: 'key-1',
  nextKeyId: 'key-2',
  envelopePurpose: 'device-wrap' as const,
  envelope: 'opaque',
  idempotencyKey: 'rotation-1',
};

describe('rotateVault', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends only the allowlisted opaque rotation DTO', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      status: 'rotated',
      keyId: 'key-2',
      revokedDeviceCount: 1,
    });
    await expect(rotateVault.rotate(input)).resolves.toEqual({
      status: 'rotated',
      keyId: 'key-2',
      revokedDeviceCount: 1,
    });
    expect(apiClient.post).toHaveBeenCalledWith('/users/me/vault/rotate', {
      ...input,
      recoveryConfirmed: true,
    });
  });

  it('rejects malformed responses and empty input', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ status: 'rotated' });
    await expect(rotateVault.rotate(input)).rejects.toThrow(
      'Invalid vault rotation response',
    );
    await expect(
      rotateVault.rotate({ ...input, envelope: '' }),
    ).rejects.toThrow('Invalid vault rotation input');
  });
});
