import type { RotationTranscriptSnapshot } from '#shared/adapters/vault-protocol/rotation-transcript';
import { apiClient } from '#shared/api';
import { dualRootRotationPaths } from '#shared/api/vault-protocol/dual-root-rotation/constants';
import { rotationTranscriptSchema } from '#shared/api/vault-protocol/dual-root-rotation/rotationTranscriptSchema';
import type { PrepareDualRootRotationInput } from '#shared/api/vault-protocol/dual-root-rotation/types';

export const prepareDualRootRotation = async (
  input: PrepareDualRootRotationInput,
  signal?: AbortSignal,
): Promise<RotationTranscriptSnapshot> => {
  const response = await apiClient.post<unknown, object>(
    dualRootRotationPaths.prepare,
    {
      vaultId: input.vaultId,
      deviceId: input.deviceId,
      currentKeyId: input.currentKeyId,
      nextKeyId: input.nextKeyId,
      nextRecoveryPublicKey: input.nextRecoveryPublicKey,
      signingPublicKey: input.signingPublicKey,
      envelopePurpose: input.envelopePurpose,
      envelope: input.envelope,
      ...(input.passkeyEnvelope === undefined
        ? {}
        : { passkeyEnvelope: input.passkeyEnvelope }),
    },
    signal === undefined ? undefined : { signal },
  );
  const parsed = rotationTranscriptSchema.safeParse(response);
  if (!parsed.success) throw new Error('Invalid dual-root rotation transcript');
  const transcript = parsed.data;
  const expiresAt = Date.parse(transcript.expiresAt);
  const now = Date.now();
  if (
    transcript.accountId !== input.accountId ||
    transcript.workspaceId !== input.workspaceId ||
    transcript.vaultId !== input.vaultId ||
    transcript.deviceId !== input.deviceId ||
    transcript.currentKeyId !== input.currentKeyId ||
    transcript.nextKeyId !== input.nextKeyId ||
    transcript.nextRecoveryPublicKey !== input.nextRecoveryPublicKey ||
    transcript.signingPublicKey !== input.signingPublicKey ||
    transcript.envelopePurpose !== input.envelopePurpose ||
    transcript.envelope !== input.envelope ||
    transcript.passkeyEnvelope !== input.passkeyEnvelope ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= now ||
    expiresAt > now + 60_000
  )
    throw new Error('Dual-root rotation context mismatch');
  return transcript;
};
