import type { RotationTranscriptResponse } from '@vault-protocol/application/mappers/mapRotationTranscriptToResponse/types';
import { dualRootRotationDtoLimits } from '@vault-protocol/presentation/dto/dual-root-rotation/constants';
export const isRotationDtoWithinLimit = (
  value: RotationTranscriptResponse,
): boolean =>
  Buffer.byteLength(
    JSON.stringify([
      dualRootRotationDtoLimits.domain,
      dualRootRotationDtoLimits.version,
      dualRootRotationDtoLimits.cryptoSuite,
      value.accountId,
      value.workspaceId,
      value.vaultId,
      value.deviceId,
      value.currentKeyId,
      value.nextKeyId,
      value.challenge,
      value.expiresAt,
      value.currentRecoveryPublicKey,
      value.nextRecoveryPublicKey,
      value.signingPublicKey,
      value.envelopePurpose,
      value.envelope,
      value.passkeyEnvelope ?? null,
    ]),
    'utf8',
  ) <= dualRootRotationDtoLimits.messageBytes;
