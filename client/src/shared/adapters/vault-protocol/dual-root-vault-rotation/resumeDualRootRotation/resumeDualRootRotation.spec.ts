import { ed25519 } from '@noble/curves/ed25519.js';
import { hexToBytes } from '@noble/curves/utils.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { encryptedPersistence } from '#shared/adapters/persistence';
import { resumeDualRootRotation } from '#shared/adapters/vault-protocol/dual-root-vault-rotation/resumeDualRootRotation';
import { buildRotationFixture } from '#shared/adapters/vault-protocol/dual-root-vault-rotation/testing/buildRotationFixture';
import { encodeRotationTranscript } from '#shared/adapters/vault-protocol/rotation-transcript/encode';
import {
  finalizeDualRootRotation,
  prepareDualRootRotation,
} from '#shared/api/vault-protocol/dual-root-rotation';

vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    requireVaultSyncMaterial: vi.fn(),
    getGeneration: vi.fn(),
    isUnlocked: vi.fn(),
    renewPendingVaultRotation: vi.fn(),
    clearPendingVaultRotation: vi.fn(),
  },
}));
vi.mock('#shared/api/vault-protocol/dual-root-rotation', () => ({
  prepareDualRootRotation: vi.fn(),
  finalizeDualRootRotation: vi.fn(),
}));
afterEach(() => vi.resetAllMocks());
describe('resumeDualRootRotation', () => {
  it('should renew an expired challenge after restart without changing the confirmed roots', async () => {
    const f = await buildRotationFixture();
    vi.mocked(encryptedPersistence.requireVaultSyncMaterial).mockReturnValue(
      f.nextMaterial,
    );
    vi.mocked(encryptedPersistence.getGeneration).mockReturnValue(7);
    vi.mocked(encryptedPersistence.isUnlocked).mockReturnValue(true);
    const renewed = {
      ...f.transcript,
      challenge: 'B'.repeat(43),
      expiresAt: new Date(Date.now() + 30_000).toISOString(),
    };
    vi.mocked(prepareDualRootRotation).mockResolvedValue(renewed);
    await expect(
      resumeDualRootRotation({
        material: f.nextMaterial,
        generation: 7,
        bootstrap: f.bootstrap,
        pending: f.pending,
        recoveryBackup: f.backup,
      }),
    ).resolves.toEqual({ status: 'resumed', keyId: f.transcript.nextKeyId });
    expect(prepareDualRootRotation).toHaveBeenCalledWith(
      expect.objectContaining({
        nextKeyId: f.transcript.nextKeyId,
        nextRecoveryPublicKey: f.transcript.nextRecoveryPublicKey,
        envelope: f.transcript.envelope,
      }),
    );
    expect(encryptedPersistence.renewPendingVaultRotation).toHaveBeenCalledWith(
      f.transcript.challenge,
      renewed,
    );
    expect(
      encryptedPersistence.renewPendingVaultRotation,
    ).toHaveBeenCalledBefore(vi.mocked(finalizeDualRootRotation));
    const sent = vi.mocked(finalizeDualRootRotation).mock.calls[0]?.[0];
    if (sent === undefined) throw new Error('Missing proof');
    expect(
      ed25519.verify(
        hexToBytes(sent.recoverySignature),
        encodeRotationTranscript(renewed),
        hexToBytes(f.transcript.currentRecoveryPublicKey),
      ),
    ).toBe(true);
    expect(
      ed25519.verify(
        hexToBytes(sent.recoverySignature),
        encodeRotationTranscript(renewed),
        hexToBytes(f.transcript.nextRecoveryPublicKey),
      ),
    ).toBe(false);
  });
  it('should replay the exact receipt when PG committed but its response was lost', async () => {
    const f = await buildRotationFixture();
    vi.mocked(encryptedPersistence.requireVaultSyncMaterial).mockReturnValue(
      f.nextMaterial,
    );
    vi.mocked(encryptedPersistence.getGeneration).mockReturnValue(7);
    vi.mocked(encryptedPersistence.isUnlocked).mockReturnValue(true);
    await expect(
      resumeDualRootRotation({
        material: f.nextMaterial,
        generation: 7,
        bootstrap: {
          ...f.bootstrap,
          keyId: f.transcript.nextKeyId,
          recoveryPublicKey: f.transcript.nextRecoveryPublicKey,
        },
        pending: f.pending,
        recoveryBackup: f.backup,
      }),
    ).resolves.toEqual({ status: 'resumed', keyId: f.transcript.nextKeyId });
    expect(prepareDualRootRotation).not.toHaveBeenCalled();
    expect(finalizeDualRootRotation).toHaveBeenCalledWith(
      expect.objectContaining({ transcript: f.transcript }),
    );
  });
  it('should retain the journal when finalize fails and retry the renewed transcript', async () => {
    const f = await buildRotationFixture();
    vi.mocked(encryptedPersistence.requireVaultSyncMaterial).mockReturnValue(
      f.nextMaterial,
    );
    vi.mocked(encryptedPersistence.getGeneration).mockReturnValue(7);
    vi.mocked(encryptedPersistence.isUnlocked).mockReturnValue(true);
    const renewed = {
      ...f.transcript,
      challenge: 'B'.repeat(43),
      expiresAt: new Date(Date.now() + 30_000).toISOString(),
    };
    vi.mocked(prepareDualRootRotation).mockResolvedValue(renewed);
    vi.mocked(finalizeDualRootRotation).mockRejectedValueOnce(
      new Error('Network lost'),
    );
    await expect(
      resumeDualRootRotation({
        material: f.nextMaterial,
        generation: 7,
        bootstrap: f.bootstrap,
        pending: f.pending,
        recoveryBackup: f.backup,
      }),
    ).rejects.toThrow('Network lost');
    expect(
      encryptedPersistence.clearPendingVaultRotation,
    ).not.toHaveBeenCalled();
    await resumeDualRootRotation({
      material: f.nextMaterial,
      generation: 7,
      bootstrap: f.bootstrap,
      pending: {
        ...f.pending,
        idempotencyKey: renewed.challenge,
        transcript: renewed,
      },
      recoveryBackup: f.backup,
    });
    expect(prepareDualRootRotation).toHaveBeenCalledTimes(1);
    expect(encryptedPersistence.clearPendingVaultRotation).toHaveBeenCalledWith(
      renewed.challenge,
    );
  });
  it('should reject changed authority or an unconfirmed journal before issuing a request', async () => {
    const f = await buildRotationFixture();
    await expect(
      resumeDualRootRotation({
        material: f.nextMaterial,
        generation: 7,
        bootstrap: { ...f.bootstrap, recoveryPublicKey: '0'.repeat(64) },
        pending: f.pending,
        recoveryBackup: f.backup,
      }),
    ).rejects.toThrow('context mismatch');
    expect(prepareDualRootRotation).not.toHaveBeenCalled();
    expect(finalizeDualRootRotation).not.toHaveBeenCalled();
  });
  it('should stop before finalize when logout occurs while renewal is pending', async () => {
    const f = await buildRotationFixture();
    vi.mocked(encryptedPersistence.requireVaultSyncMaterial).mockReturnValue(
      f.nextMaterial,
    );
    vi.mocked(encryptedPersistence.getGeneration).mockReturnValue(7);
    vi.mocked(encryptedPersistence.isUnlocked).mockReturnValue(true);
    vi.mocked(prepareDualRootRotation).mockImplementation(async () => {
      vi.mocked(encryptedPersistence.isUnlocked).mockReturnValue(false);
      return {
        ...f.transcript,
        challenge: 'B'.repeat(43),
        expiresAt: new Date(Date.now() + 30_000).toISOString(),
      };
    });
    await expect(
      resumeDualRootRotation({
        material: f.nextMaterial,
        generation: 7,
        bootstrap: f.bootstrap,
        pending: f.pending,
        recoveryBackup: f.backup,
      }),
    ).rejects.toThrow('session changed');
    expect(finalizeDualRootRotation).not.toHaveBeenCalled();
    expect(
      encryptedPersistence.renewPendingVaultRotation,
    ).not.toHaveBeenCalled();
  });
});
