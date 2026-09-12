import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '#shared/api';
import { vaultEnrollment } from '#shared/api/vault-protocol/vault-enrollment';

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
        digest: 'a'.repeat(64),
        signature: 'b'.repeat(128),
      }),
    ).resolves.toBeUndefined();
    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/me/vault/enrollment/v2/confirm',
      {
        challenge: 'challenge-1',
        deviceId: 'device-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
        digest: 'a'.repeat(64),
        signature: 'b'.repeat(128),
      },
    );
  });
});
