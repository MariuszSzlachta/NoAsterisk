import { beforeEach, describe, expect, it, vi } from 'vitest';

import { encryptedPersistence } from '#shared/adapters/persistence';
import { recoveryCode } from '#shared/adapters/vault-protocol/recovery-code';
import { vaultRotation } from '#shared/adapters/vault-protocol/vault-rotation';
import { passkeyPrf } from '#shared/adapters/webauthn/passkey-prf';
import { issueServerShare } from '#shared/api/vault-protocol/issue-server-share';
import { rotateVault } from '#shared/api/vault-protocol/rotate-vault';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';
import { webauthnChallenge } from '#shared/api/vault-protocol/webauthn-challenge';
import { webauthnCredentials } from '#shared/api/vault-protocol/webauthn-credentials';

const { persistence, protocol } = vi.hoisted(() => ({
  persistence: {
    requireVaultSyncMaterial: vi.fn(),
    getGeneration: vi.fn(() => 1),
    isUnlocked: vi.fn(() => true),
    readVaultLocalShare: vi.fn(),
    verifyVaultVmk: vi.fn(),
    rotateVaultKeys: vi.fn(),
    getPendingVaultRotation: vi.fn(),
    clearPendingVaultRotation: vi.fn(),
    confirmPendingVaultRotationBackup: vi.fn(),
    getVaultTransferMaterial: vi.fn(),
  },
  protocol: {
    generateVmk: vi.fn(),
    deriveKeys: vi.fn(),
    deriveDeviceKey: vi.fn(),
    derivePrfKey: vi.fn(),
    wrapVmk: vi.fn(),
    canonicalize: vi.fn(() => 'canonical'),
  },
}));

const buildRotationInput = (
  confirmRecoveryCode = async (): Promise<boolean> => true,
) => ({
  recoveryCode: 'recovery',
  confirmRecoveryCode,
});

vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: persistence,
}));
vi.mock('#shared/adapters/vault-protocol/vault-protocol', () => ({
  vaultProtocol: protocol,
}));
vi.mock('#shared/adapters/vault-protocol/recovery-code', () => ({
  recoveryCode: { restore: vi.fn(), encode: vi.fn(() => 'new-recovery-code') },
}));
vi.mock('#shared/api/vault-protocol/issue-server-share', () => ({
  issueServerShare: vi.fn(),
}));
vi.mock('#shared/api/vault-protocol/rotate-vault', () => ({
  rotateVault: { rotate: vi.fn() },
}));
vi.mock('#shared/api/vault-protocol/vault-bootstrap', () => ({
  vaultBootstrap: { get: vi.fn() },
}));
vi.mock('#shared/api/vault-protocol/webauthn-challenge', () => ({
  webauthnChallenge: { createAuthenticationChallengeRecord: vi.fn() },
}));
vi.mock('#shared/api/vault-protocol/webauthn-credentials', () => ({
  webauthnCredentials: { verifyAuthentication: vi.fn() },
}));
vi.mock('#shared/adapters/webauthn/passkey-prf', () => ({
  passkeyPrf: { run: vi.fn() },
}));

describe('vaultRotation', () => {
  it('should reject legacy rotation before backup prompts or key writes when independent authority is registered', async () => {
    const bootstrap = await vaultBootstrap.get();
    if (bootstrap.status !== 'available') throw new Error('Missing bootstrap');
    vi.mocked(vaultBootstrap.get).mockResolvedValue({
      ...bootstrap,
      recoveryPublicKey: 'a'.repeat(64),
    });
    const confirm = vi.fn(async () => true);
    await expect(
      vaultRotation.rotate(buildRotationInput(confirm)),
    ).rejects.toThrow();
    await expect(
      vaultRotation.rotateWithPasskey('recovery', confirm),
    ).rejects.toThrow();
    expect(confirm).not.toHaveBeenCalled();
    expect(encryptedPersistence.rotateVaultKeys).not.toHaveBeenCalled();
    expect(rotateVault.rotate).not.toHaveBeenCalled();
  });
  beforeEach(async () => {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    vi.clearAllMocks();
    vi.mocked(encryptedPersistence.getPendingVaultRotation).mockResolvedValue(
      undefined,
    );
    vi.mocked(encryptedPersistence.rotateVaultKeys).mockImplementation(
      async (_keys, context) => {
        const material = encryptedPersistence.requireVaultSyncMaterial();
        vi.mocked(
          encryptedPersistence.requireVaultSyncMaterial,
        ).mockReturnValue({ ...material, context });
      },
    );
    vi.mocked(encryptedPersistence.requireVaultSyncMaterial).mockReturnValue({
      syncKey: key,
      signingKey: key,
      verifyKey: key,
      context: {
        accountId: 'account-1',
        workspaceId: 'workspace-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
        deviceId: 'device-1',
      },
    });
    vi.mocked(vaultBootstrap.get).mockResolvedValue({
      status: 'available',
      protocolVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      deviceEnvelope: 'opaque',
      securityProfile: 'standard',
    });
    vi.mocked(encryptedPersistence.readVaultLocalShare).mockResolvedValue(key);
    vi.mocked(recoveryCode.restore).mockResolvedValue(
      new Uint8Array(32).fill(1),
    );
    vi.mocked(issueServerShare).mockResolvedValue(new Uint8Array(32).fill(2));
    vi.mocked(protocol.generateVmk).mockReturnValue(new Uint8Array(32).fill(3));
    vi.mocked(protocol.deriveKeys).mockResolvedValue({
      local: key,
      sync: key,
      check: key,
    });
    vi.mocked(protocol.deriveDeviceKey).mockResolvedValue(key);
    vi.mocked(protocol.derivePrfKey).mockResolvedValue(key);
    vi.mocked(protocol.wrapVmk).mockResolvedValue({
      header: { purpose: 'device-wrap' },
      ciphertext: 'opaque-envelope',
    });
    vi.mocked(rotateVault.rotate).mockImplementation(async (request) => ({
      status: 'rotated',
      keyId: request.nextKeyId,
      revokedDeviceCount: 1,
    }));
    vi.mocked(
      webauthnChallenge.createAuthenticationChallengeRecord,
    ).mockResolvedValue({
      bytes: new Uint8Array([1]),
      encoded: 'challenge',
    });
    vi.mocked(passkeyPrf.run).mockResolvedValue({
      prfKey: key,
      credentialId: 'credential-1',
      assertion: {
        id: 'credential-1',
        rawId: 'raw-id',
        response: {
          clientDataJSON: 'client',
          authenticatorData: 'auth',
          signature: 'sig',
        },
        type: 'public-key',
      },
    });
    vi.mocked(webauthnCredentials.verifyAuthentication).mockResolvedValue(
      undefined,
    );
  });

  it('verifies recovery locally, re-encrypts locally, then commits opaque server rotation', async () => {
    await vaultRotation.rotate(buildRotationInput());
    expect(encryptedPersistence.verifyVaultVmk).toHaveBeenCalled();
    expect(encryptedPersistence.rotateVaultKeys).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ vaultId: 'vault-1' }),
      expect.objectContaining({
        envelope: JSON.stringify({
          header: { purpose: 'device-wrap' },
          ciphertext: 'opaque-envelope',
        }),
      }),
    );
    expect(rotateVault.rotate).toHaveBeenCalledWith(
      expect.objectContaining({
        envelope: JSON.stringify({
          header: { purpose: 'device-wrap' },
          ciphertext: 'opaque-envelope',
        }),
      }),
    );
    expect(encryptedPersistence.clearPendingVaultRotation).toHaveBeenCalled();
  });

  it('leaves the encrypted pending journal when the server commit fails', async () => {
    vi.mocked(rotateVault.rotate).mockRejectedValue(new Error('transport'));
    await expect(vaultRotation.rotate(buildRotationInput())).rejects.toThrow(
      'transport',
    );
    expect(
      encryptedPersistence.clearPendingVaultRotation,
    ).not.toHaveBeenCalled();
  });

  it('preserves the optional PRF envelope during standard rotation', async () => {
    vi.mocked(vaultBootstrap.get).mockResolvedValue({
      status: 'available',
      protocolVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      deviceEnvelope: 'opaque-device',
      passkeyEnvelope: 'opaque-passkey',
      securityProfile: 'standard',
    });

    await vaultRotation.rotate(buildRotationInput());

    expect(encryptedPersistence.rotateVaultKeys).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.objectContaining({ passkeyEnvelope: expect.any(String) }),
    );
    expect(rotateVault.rotate).toHaveBeenCalledWith(
      expect.objectContaining({ passkeyEnvelope: expect.any(String) }),
    );
  });

  it('resumes a pending idempotent commit after local unlock', async () => {
    const material = encryptedPersistence.requireVaultSyncMaterial();
    vi.mocked(encryptedPersistence.requireVaultSyncMaterial).mockReturnValue({
      ...material,
      context: { ...material.context, keyId: 'key-2' },
    });
    vi.mocked(encryptedPersistence.getPendingVaultRotation).mockResolvedValue({
      currentKeyId: 'key-1',
      nextKeyId: 'key-2',
      idempotencyKey: 'rotation-1',
      envelopePurpose: 'device-wrap',
      envelope: 'opaque',
      currentVmkEnvelope: { header: {}, ciphertext: 'opaque' },
      nextVmkEnvelope: { header: {}, ciphertext: 'opaque' },
      recoveryBackupConfirmed: true,
    });
    vi.mocked(rotateVault.rotate).mockResolvedValue({
      status: 'rotated',
      keyId: 'key-2',
      revokedDeviceCount: 1,
    });
    await expect(vaultRotation.resumePending()).resolves.toBe(true);
    expect(encryptedPersistence.clearPendingVaultRotation).toHaveBeenCalledWith(
      'rotation-1',
    );
  });

  it('uses PRF only and removes LocalShare from high-security rotation input', async () => {
    await vaultRotation.rotateWithPasskey('recovery', async () => true);
    expect(protocol.derivePrfKey).toHaveBeenCalled();
    expect(encryptedPersistence.rotateVaultKeys).toHaveBeenCalledWith(
      expect.objectContaining({ localShare: null }),
      expect.any(Object),
      expect.objectContaining({ envelopePurpose: 'passkey-wrap' }),
    );
  });

  it('does not change either database when recovery backup is declined', async () => {
    await expect(
      vaultRotation.rotate(buildRotationInput(async () => false)),
    ).rejects.toThrow('Recovery backup');
    expect(encryptedPersistence.rotateVaultKeys).not.toHaveBeenCalled();
    expect(rotateVault.rotate).not.toHaveBeenCalled();
    expect(issueServerShare).not.toHaveBeenCalled();
  });

  it('does not rotate before the new recovery backup is confirmed', async () => {
    let confirm: ((confirmed: boolean) => void) | undefined;
    const backup = new Promise<boolean>((resolve) => {
      confirm = resolve;
    });
    const rotation = vaultRotation.rotate(buildRotationInput(() => backup));
    await vi.waitFor(() => expect(recoveryCode.encode).toHaveBeenCalled());
    expect(encryptedPersistence.rotateVaultKeys).not.toHaveBeenCalled();
    expect(rotateVault.rotate).not.toHaveBeenCalled();
    confirm?.(true);
    await expect(rotation).resolves.toEqual({
      recoveryCode: 'new-recovery-code',
    });
  });

  it('does not silently commit a legacy journal without recovery confirmation', async () => {
    const material = encryptedPersistence.requireVaultSyncMaterial();
    vi.mocked(encryptedPersistence.requireVaultSyncMaterial).mockReturnValue({
      ...material,
      context: { ...material.context, keyId: 'key-2' },
    });
    vi.mocked(encryptedPersistence.getPendingVaultRotation).mockResolvedValue({
      currentKeyId: 'key-1',
      nextKeyId: 'key-2',
      idempotencyKey: 'rotation-1',
      envelopePurpose: 'device-wrap',
      envelope: 'opaque',
      currentVmkEnvelope: { header: {}, ciphertext: 'opaque' },
      nextVmkEnvelope: { header: {}, ciphertext: 'opaque' },
    });
    await expect(vaultRotation.resumePending()).rejects.toThrow(
      'confirmed recovery backup',
    );
    expect(rotateVault.rotate).not.toHaveBeenCalled();
    expect(
      encryptedPersistence.clearPendingVaultRotation,
    ).not.toHaveBeenCalled();
  });

  it('clears the restored VMK when the session changes before verification', async () => {
    const restored = new Uint8Array(32).fill(9);
    vi.mocked(recoveryCode.restore).mockResolvedValue(restored);
    let generationReads = 0;
    vi.mocked(encryptedPersistence.getGeneration).mockImplementation(() => {
      generationReads += 1;
      return generationReads > 4 ? 2 : 1;
    });

    await expect(vaultRotation.rotate(buildRotationInput())).rejects.toThrow(
      'Vault operation session changed',
    );
    expect(restored.every((byte) => byte === 0)).toBe(true);
    expect(encryptedPersistence.rotateVaultKeys).not.toHaveBeenCalled();
    expect(rotateVault.rotate).not.toHaveBeenCalled();
  });
});
