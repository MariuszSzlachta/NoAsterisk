import { apiClient } from '#shared/api';
import { dualRootRotationPaths } from '#shared/api/vault-protocol/dual-root-rotation/constants';
import { rotationProofSchema } from '#shared/api/vault-protocol/dual-root-rotation/rotationProofSchema';
import { rotationTranscriptSchema } from '#shared/api/vault-protocol/dual-root-rotation/rotationTranscriptSchema';
import type { FinalizeDualRootRotationInput } from '#shared/api/vault-protocol/dual-root-rotation/types';

export const finalizeDualRootRotation = async (
  input: FinalizeDualRootRotationInput,
  signal?: AbortSignal,
): Promise<void> => {
  const transcript = rotationTranscriptSchema.safeParse(input.transcript);
  const proof = rotationProofSchema.safeParse({
    deviceSignature: input.deviceSignature,
    recoverySignature: input.recoverySignature,
  });
  if (!transcript.success || !proof.success)
    throw new Error('Invalid dual-root rotation proof');
  await apiClient.post<unknown, FinalizeDualRootRotationInput>(
    dualRootRotationPaths.finalize,
    { transcript: transcript.data, ...proof.data },
    signal === undefined ? undefined : { signal },
  );
};
