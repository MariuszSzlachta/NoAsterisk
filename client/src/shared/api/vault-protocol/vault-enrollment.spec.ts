import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '#shared/api';

import { vaultEnrollment } from './vault-enrollment';

vi.mock('#shared/api', () => ({ apiClient: { post: vi.fn() } }));

describe('vaultEnrollment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the explicit confirmation DTO after local key confirmation', async () => {
    await expect(
      vaultEnrollment.confirm({
        challenge: 'challenge-1',
        deviceId: 'device-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
      }),
    ).resolves.toBeUndefined();
    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/me/vault/enrollment/confirm',
      {
        challenge: 'challenge-1',
        deviceId: 'device-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
      },
    );
  });
});
