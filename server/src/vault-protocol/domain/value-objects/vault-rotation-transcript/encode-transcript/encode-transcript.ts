import { DomainError } from '@budget/domain';
import { vaultRotationTranscriptFormat } from '@vault-protocol/domain/value-objects/vault-rotation-transcript/constants';

export const encodeVaultRotationTranscript = (
  fields: readonly (string | number | null)[],
): Uint8Array<ArrayBuffer> => {
  const bytes = new TextEncoder().encode(JSON.stringify(fields));
  if (bytes.length > vaultRotationTranscriptFormat.maxMessageBytes)
    throw new DomainError('Vault rotation transcript exceeds limit');
  return bytes;
};
