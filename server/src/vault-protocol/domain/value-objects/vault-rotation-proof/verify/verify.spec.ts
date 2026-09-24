import { DomainError } from '@budget/domain';
import { verifyVaultRotationProof } from '@vault-protocol/domain/value-objects/vault-rotation-proof';
import { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';

const transcript = new VaultRotationTranscript({
  accountId: 'account-1',
  workspaceId: 'workspace-1',
  vaultId: 'vault-1',
  deviceId: 'device-1',
  currentKeyId: 'key-1',
  nextKeyId: 'key-2',
  challenge: 'a'.repeat(43),
  expiresAt: Date.now() + 60_000,
  currentRecoveryPublicKey: 'a'.repeat(64),
  nextRecoveryPublicKey: 'b'.repeat(64),
  signingPublicKey: '{"kty":"EC"}',
  envelopePurpose: 'device-wrap',
  envelope: 'opaque-envelope',
});

const proof = {
  deviceSignature: 'device-signature',
  recoverySignature: 'recovery-signature',
};

describe('verifyVaultRotationProof', () => {
  it('verifies both signatures over one exact transcript', async () => {
    const verifier = {
      verifyDevice: jest.fn().mockResolvedValue(true),
      verifyRecovery: jest.fn().mockResolvedValue(true),
    };

    await expect(
      verifyVaultRotationProof(transcript, proof, verifier),
    ).resolves.toBeUndefined();
    const message = transcript.toSigningBytes();
    expect(verifier.verifyDevice).toHaveBeenCalledWith(
      transcript.snapshot.signingPublicKey,
      message,
      proof.deviceSignature,
    );
    expect(verifier.verifyRecovery).toHaveBeenCalledWith(
      transcript.snapshot.currentRecoveryPublicKey,
      message,
      proof.recoverySignature,
    );
  });

  it('does not attempt the recovery proof when device proof fails', async () => {
    const verifier = {
      verifyDevice: jest.fn().mockResolvedValue(false),
      verifyRecovery: jest.fn().mockResolvedValue(true),
    };

    await expect(
      verifyVaultRotationProof(transcript, proof, verifier),
    ).rejects.toBeInstanceOf(DomainError);
    expect(verifier.verifyRecovery).not.toHaveBeenCalled();
  });

  it('rejects an invalid recovery proof', async () => {
    const verifier = {
      verifyDevice: jest.fn().mockResolvedValue(true),
      verifyRecovery: jest.fn().mockResolvedValue(false),
    };

    await expect(
      verifyVaultRotationProof(transcript, proof, verifier),
    ).rejects.toThrow('Invalid vault rotation authorization');
  });
});
