import type { RotationTranscriptSnapshot } from '#shared/adapters/vault-protocol/rotation-transcript';
import { encodeRotationTranscript } from '#shared/adapters/vault-protocol/rotation-transcript/encode';

export const isRotationTranscriptWithinLimit = (
  value: RotationTranscriptSnapshot,
): boolean => {
  try {
    encodeRotationTranscript(value);
    return true;
  } catch {
    return false;
  }
};
