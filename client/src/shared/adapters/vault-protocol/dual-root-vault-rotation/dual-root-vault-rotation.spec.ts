import { afterEach, describe, expect, it, vi } from 'vitest';

import { encryptedPersistence } from '#shared/adapters/persistence';
import { rotateWithRecoveryAuthority } from '#shared/adapters/vault-protocol/dual-root-vault-rotation';
import { buildRotationFixture } from '#shared/adapters/vault-protocol/dual-root-vault-rotation/testing/buildRotationFixture';
import { deriveRecoveryPublicKey } from '#shared/adapters/vault-protocol/recovery-authority';
import { decodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup/decode';
import {
  finalizeDualRootRotation,
  prepareDualRootRotation,
} from '#shared/api/vault-protocol/dual-root-rotation';
import { issueServerShare } from '#shared/api/vault-protocol/issue-server-share';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';
import { bytesToHex } from '#shared/lib/bytes-to-hex';

vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    requireVaultSyncMaterial: vi.fn(),
    getGeneration: vi.fn(),
    isUnlocked: vi.fn(),
    getPendingVaultRotation: vi.fn(),
    verifyVaultVmk: vi.fn(),
    readVaultLocalShare: vi.fn(),
    rotateVaultKeys: vi.fn(),
    clearPendingVaultRotation: vi.fn(),
    renewPendingVaultRotation: vi.fn(),
  },
}));
vi.mock('#shared/api/vault-protocol/dual-root-rotation', () => ({
  prepareDualRootRotation: vi.fn(),
  finalizeDualRootRotation: vi.fn(),
}));
vi.mock('#shared/api/vault-protocol/issue-server-share', () => ({
  issueServerShare: vi.fn(),
}));
vi.mock('#shared/api/vault-protocol/vault-bootstrap', () => ({
  vaultBootstrap: { get: vi.fn() },
}));
afterEach(() => vi.resetAllMocks());
describe('rotateWithRecoveryAuthority with native cryptography', () => {
  it('should retain a recoverable next backup and journal before publishing the rotation', async () => {
    const fixture = await buildRotationFixture();
    vi.mocked(encryptedPersistence.requireVaultSyncMaterial).mockReturnValue(
      fixture.material,
    );
    vi.mocked(encryptedPersistence.getGeneration).mockReturnValue(7);
    vi.mocked(encryptedPersistence.isUnlocked).mockReturnValue(true);
    vi.mocked(vaultBootstrap.get).mockResolvedValue(fixture.bootstrap);
    vi.mocked(encryptedPersistence.readVaultLocalShare).mockResolvedValue(
      fixture.localShare,
    );
    vi.mocked(issueServerShare).mockResolvedValue(new Uint8Array(32).fill(5));
    vi.mocked(prepareDualRootRotation).mockImplementation(async (input) => ({
      ...fixture.transcript,
      ...input,
      challenge: 'B'.repeat(43),
      expiresAt: new Date(Date.now() + 30_000).toISOString(),
    }));
    vi.mocked(encryptedPersistence.rotateVaultKeys).mockImplementation(
      async (keys, context) => {
        vi.mocked(
          encryptedPersistence.requireVaultSyncMaterial,
        ).mockReturnValue({ ...fixture.material, syncKey: keys.sync, context });
      },
    );
    const confirmation = vi.fn().mockResolvedValue(true);
    const result = await rotateWithRecoveryAuthority({
      recoveryBackup: fixture.backup,
      confirmRecoveryBackup: confirmation,
    });
    expect(result.status).toBe('rotated');
    if (result.status !== 'rotated') throw new Error('Expected new rotation');
    const restored = await decodeRecoveryBackup(result.recoveryBackup);
    try {
      expect(bytesToHex(deriveRecoveryPublicKey(restored.recoverySeed))).toBe(
        vi.mocked(prepareDualRootRotation).mock.calls[0]?.[0]
          .nextRecoveryPublicKey,
      );
      expect(result.recoveryBackup).not.toBe(fixture.backup);
    } finally {
      restored.vmk.fill(0);
      restored.recoverySeed.fill(0);
    }
    expect(confirmation).toHaveBeenCalledWith(result.recoveryBackup);
    expect(encryptedPersistence.rotateVaultKeys).toHaveBeenCalledBefore(
      vi.mocked(finalizeDualRootRotation),
    );
    expect(encryptedPersistence.clearPendingVaultRotation).toHaveBeenCalledWith(
      'B'.repeat(43),
    );
    expect(prepareDualRootRotation).toHaveBeenCalledWith(
      expect.not.objectContaining({ recoveryBackup: expect.anything() }),
    );
  });
  it('should leave the active roots unchanged when the next backup is cancelled', async () => {
    const fixture = await buildRotationFixture();
    vi.mocked(encryptedPersistence.requireVaultSyncMaterial).mockReturnValue(
      fixture.material,
    );
    vi.mocked(encryptedPersistence.getGeneration).mockReturnValue(7);
    vi.mocked(encryptedPersistence.isUnlocked).mockReturnValue(true);
    vi.mocked(vaultBootstrap.get).mockResolvedValue(fixture.bootstrap);
    await expect(
      rotateWithRecoveryAuthority({
        recoveryBackup: fixture.backup,
        confirmRecoveryBackup: vi.fn().mockResolvedValue(false),
      }),
    ).rejects.toThrow('not confirmed');
    expect(encryptedPersistence.rotateVaultKeys).not.toHaveBeenCalled();
    expect(prepareDualRootRotation).not.toHaveBeenCalled();
    expect(finalizeDualRootRotation).not.toHaveBeenCalled();
  });
});
