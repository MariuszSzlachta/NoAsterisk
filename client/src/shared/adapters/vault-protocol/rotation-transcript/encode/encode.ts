import { rotationTranscriptFormat } from '#shared/adapters/vault-protocol/rotation-transcript/constants';
import { isRotationIdentifier } from '#shared/adapters/vault-protocol/rotation-transcript/isRotationIdentifier';
import { rotationRecoveryPublicKeyPattern } from '#shared/adapters/vault-protocol/rotation-transcript/patterns/recovery-public-key.pattern';
import { rotationChallengePattern } from '#shared/adapters/vault-protocol/rotation-transcript/patterns/rotation-challenge.pattern';
import type { RotationTranscriptSnapshot } from '#shared/adapters/vault-protocol/rotation-transcript/types';

export const encodeRotationTranscript = (
  snapshot: RotationTranscriptSnapshot,
): Uint8Array<ArrayBuffer> => {
  if (
    !isRotationIdentifier(snapshot.accountId) ||
    !isRotationIdentifier(snapshot.workspaceId) ||
    !isRotationIdentifier(snapshot.vaultId) ||
    !isRotationIdentifier(snapshot.deviceId) ||
    !isRotationIdentifier(snapshot.currentKeyId) ||
    !isRotationIdentifier(snapshot.nextKeyId) ||
    snapshot.currentKeyId === snapshot.nextKeyId ||
    snapshot.challenge.length !== rotationTranscriptFormat.challengeLength ||
    !rotationChallengePattern.test(snapshot.challenge) ||
    new Date(snapshot.expiresAt).toISOString() !== snapshot.expiresAt ||
    !rotationRecoveryPublicKeyPattern.test(snapshot.currentRecoveryPublicKey) ||
    !rotationRecoveryPublicKeyPattern.test(snapshot.nextRecoveryPublicKey) ||
    snapshot.currentRecoveryPublicKey === snapshot.nextRecoveryPublicKey ||
    snapshot.signingPublicKey.length === 0 ||
    snapshot.signingPublicKey.length >
      rotationTranscriptFormat.maxPublicKeyLength ||
    snapshot.envelope.length === 0 ||
    snapshot.envelope.length > rotationTranscriptFormat.maxEnvelopeLength ||
    (snapshot.passkeyEnvelope !== undefined &&
      (snapshot.passkeyEnvelope.length === 0 ||
        snapshot.passkeyEnvelope.length >
          rotationTranscriptFormat.maxEnvelopeLength)) ||
    (snapshot.envelopePurpose === 'passkey-wrap' &&
      snapshot.passkeyEnvelope !== undefined)
  )
    throw new Error('Invalid vault rotation transcript');
  const bytes = new TextEncoder().encode(
    JSON.stringify([
      rotationTranscriptFormat.domain,
      rotationTranscriptFormat.version,
      rotationTranscriptFormat.cryptoSuite,
      snapshot.accountId,
      snapshot.workspaceId,
      snapshot.vaultId,
      snapshot.deviceId,
      snapshot.currentKeyId,
      snapshot.nextKeyId,
      snapshot.challenge,
      snapshot.expiresAt,
      snapshot.currentRecoveryPublicKey,
      snapshot.nextRecoveryPublicKey,
      snapshot.signingPublicKey,
      snapshot.envelopePurpose,
      snapshot.envelope,
      snapshot.passkeyEnvelope ?? null,
    ]),
  );
  if (bytes.length > rotationTranscriptFormat.maxMessageBytes)
    throw new Error('Vault rotation transcript exceeds limit');
  return bytes;
};
