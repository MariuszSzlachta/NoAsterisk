import { DomainError } from '@budget/domain';
import type { VaultSignatureVerifierPort } from '@vault-protocol/domain/ports/vault-signature-verifier';
import type { VaultRotationProof } from '@vault-protocol/domain/value-objects/vault-rotation-proof/types';
import type { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';

export const verifyVaultRotationProof = async (
  transcript: VaultRotationTranscript,
  proof: VaultRotationProof,
  verifier: VaultSignatureVerifierPort,
): Promise<void> => {
  const message = transcript.toSigningBytes();
  const deviceValid = await verifier.verifyDevice(
    transcript.snapshot.signingPublicKey,
    message,
    proof.deviceSignature,
  );
  if (!deviceValid)
    throw new DomainError('Invalid vault rotation authorization');
  const recoveryValid = await verifier.verifyRecovery(
    transcript.snapshot.currentRecoveryPublicKey,
    message,
    proof.recoverySignature,
  );
  if (!recoveryValid)
    throw new DomainError('Invalid vault rotation authorization');
};
