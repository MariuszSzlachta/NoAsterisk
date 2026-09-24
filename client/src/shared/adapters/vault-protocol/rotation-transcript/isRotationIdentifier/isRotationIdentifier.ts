import { rotationTranscriptFormat } from '#shared/adapters/vault-protocol/rotation-transcript/constants';

export const isRotationIdentifier = (value: string): boolean =>
  value.length > 0 &&
  value.length <= rotationTranscriptFormat.maxIdentifierLength;
