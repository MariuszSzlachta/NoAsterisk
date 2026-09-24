import { isRotationIdentifier } from '@vault-protocol/domain/value-objects/vault-rotation-transcript/isRotationIdentifier';
import { DomainError } from '@budget/domain';
import { recoveryPublicKeyPattern } from '@vault-protocol/domain/recovery-registration/patterns/recovery-public-key.pattern';
import { recoveryRegistrationFormat } from '@vault-protocol/domain/recovery-registration/constants';
import { vaultRotationTranscriptFormat } from '@vault-protocol/domain/value-objects/vault-rotation-transcript/constants';
import { rotationChallengePattern } from '@vault-protocol/domain/value-objects/vault-rotation-transcript/patterns/rotation-challenge.pattern';
import type { VaultRotationTranscriptSnapshot } from '@vault-protocol/domain/value-objects/vault-rotation-transcript/types';

export const assertVaultRotationTranscriptSnapshot = (
  snapshot: VaultRotationTranscriptSnapshot,
): void => {
  if (
    !isRotationIdentifier(snapshot.accountId) ||
    !isRotationIdentifier(snapshot.workspaceId) ||
    !isRotationIdentifier(snapshot.vaultId) ||
    !isRotationIdentifier(snapshot.deviceId) ||
    !isRotationIdentifier(snapshot.currentKeyId) ||
    !isRotationIdentifier(snapshot.nextKeyId) ||
    snapshot.currentKeyId === snapshot.nextKeyId ||
    snapshot.challenge.length !==
      vaultRotationTranscriptFormat.maxChallengeLength ||
    !rotationChallengePattern.test(snapshot.challenge) ||
    !Number.isSafeInteger(snapshot.expiresAt) ||
    snapshot.expiresAt <= 0 ||
    snapshot.currentRecoveryPublicKey.length !==
      vaultRotationTranscriptFormat.publicKeyLength ||
    !recoveryPublicKeyPattern.test(snapshot.currentRecoveryPublicKey) ||
    snapshot.nextRecoveryPublicKey.length !==
      vaultRotationTranscriptFormat.publicKeyLength ||
    !recoveryPublicKeyPattern.test(snapshot.nextRecoveryPublicKey) ||
    snapshot.currentRecoveryPublicKey === snapshot.nextRecoveryPublicKey ||
    snapshot.signingPublicKey.length === 0 ||
    snapshot.signingPublicKey.length >
      vaultRotationTranscriptFormat.maxPublicKeyLength ||
    snapshot.envelope.length === 0 ||
    snapshot.envelope.length >
      vaultRotationTranscriptFormat.maxEnvelopeLength ||
    (snapshot.passkeyEnvelope !== undefined &&
      (snapshot.passkeyEnvelope.length === 0 ||
        snapshot.passkeyEnvelope.length >
          vaultRotationTranscriptFormat.maxEnvelopeLength)) ||
    (snapshot.envelopePurpose === 'passkey-wrap' &&
      snapshot.passkeyEnvelope !== undefined)
  )
    throw new DomainError('Invalid vault rotation transcript');
  if (
    snapshot.expiresAt - Date.now() >
    recoveryRegistrationFormat.maxTimestampMs
  )
    throw new DomainError('Invalid vault rotation transcript');
};
