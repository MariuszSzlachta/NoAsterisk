import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '#shared/api';
import { finalizeDualRootRotation } from '#shared/api/vault-protocol/dual-root-rotation/finalize';
import { prepareDualRootRotation } from '#shared/api/vault-protocol/dual-root-rotation/prepare';
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

describe('prepareDualRootRotation', () => {
  it('sends only opaque public preparation fields and validates returned scope', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(transcript);
    await expect(prepareDualRootRotation(input)).resolves.toEqual(transcript);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/me/vault/rotate/prepare',
      expect.not.objectContaining({ accountId: input.accountId }),
      undefined,
    );
  });

  it('rejects a substituted transcript and forwards only its proof at finalize', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      ...transcript,
      nextRecoveryPublicKey: 'c'.repeat(64),
    });
    await expect(prepareDualRootRotation(input)).rejects.toThrow(
      'context mismatch',
    );
    await expect(
      finalizeDualRootRotation({
        transcript,
        deviceSignature: 'd'.repeat(128),
        recoverySignature: 'e'.repeat(128),
      }),
    ).resolves.toBeUndefined();
    expect(apiClient.post).toHaveBeenLastCalledWith(
      '/users/me/vault/rotate/finalize',
      expect.objectContaining({ deviceSignature: 'd'.repeat(128) }),
      undefined,
    );
  });

  it('rejects malformed proofs before making a finalize request', async () => {
    await expect(
      finalizeDualRootRotation({
        transcript,
        deviceSignature: 'not-a-signature',
        recoverySignature: 'e'.repeat(128),
      }),
    ).rejects.toThrow('Invalid dual-root rotation proof');
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
