import type { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';
import type { RotationTranscriptResponse } from '@vault-protocol/application/mappers/mapRotationTranscriptToResponse/types';

export const mapRotationTranscriptToResponse = (
  transcript: VaultRotationTranscript,
): RotationTranscriptResponse => ({
  ...transcript.snapshot,
  expiresAt: new Date(transcript.snapshot.expiresAt).toISOString(),
});
