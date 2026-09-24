import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '#shared/api';
import { finalizeDualRootRotation } from '#shared/api/vault-protocol/dual-root-rotation/finalize';
import type { PrepareDualRootRotationInput } from '#shared/api/vault-protocol/dual-root-rotation/types';

vi.mock('#shared/api', () => ({ apiClient: { post: vi.fn() } }));

const input: PrepareDualRootRotationInput = {
  accountId: 'account-1',
  workspaceId: 'workspace-1',
  vaultId: '550e8400-e29b-41d4-a716-446655440000',
  deviceId: 'device-1',
  currentKeyId: 'key-1',
  nextKeyId: 'key-2',
  nextRecoveryPublicKey: 'b'.repeat(64),
  signingPublicKey: '{"kty":"EC"}',
  envelopePurpose: 'device-wrap',
  envelope: 'opaque-envelope',
};

const transcript = {
  ...input,
  challenge: 'a'.repeat(43),
  expiresAt: new Date(Date.now() + 30_000).toISOString(),
  currentRecoveryPublicKey: 'a'.repeat(64),
};

afterEach(() => vi.clearAllMocks());

describe('finalizeDualRootRotation', () => {
  it('should send a complete validated transcript and proof', async () => {
    await finalizeDualRootRotation({
      transcript,
      deviceSignature: 'd'.repeat(128),
      recoverySignature: 'e'.repeat(128),
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/me/vault/rotate/finalize',
      expect.objectContaining({ transcript }),
      undefined,
    );
  });
  it.each(['invalid', 'g'.repeat(128), 'a'.repeat(127)])(
    'should reject invalid signatures before transport',
    async (deviceSignature) => {
      await expect(
        finalizeDualRootRotation({
          transcript,
          deviceSignature,
          recoverySignature: 'e'.repeat(128),
        }),
      ).rejects.toThrow('Invalid dual-root rotation proof');
      expect(apiClient.post).not.toHaveBeenCalled();
    },
  );
});
