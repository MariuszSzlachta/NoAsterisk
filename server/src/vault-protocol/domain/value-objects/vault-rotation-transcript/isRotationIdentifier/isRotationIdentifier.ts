import { vaultRotationTranscriptFormat } from '@vault-protocol/domain/value-objects/vault-rotation-transcript/constants';
export const isRotationIdentifier = (value: string): boolean =>
  value.length > 0 &&
  value.length <= vaultRotationTranscriptFormat.maxIdentifierLength;
