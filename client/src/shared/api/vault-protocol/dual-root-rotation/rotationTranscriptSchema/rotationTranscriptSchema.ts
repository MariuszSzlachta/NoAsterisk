import { z } from 'zod';

import { rotationTranscriptFormat } from '#shared/adapters/vault-protocol/rotation-transcript/constants';
import { rotationChallengePattern } from '#shared/adapters/vault-protocol/rotation-transcript/patterns/rotation-challenge.pattern';
import { isRotationTranscriptWithinLimit } from '#shared/api/vault-protocol/dual-root-rotation/isRotationTranscriptWithinLimit';
import { rotationIdentifierSchema } from '#shared/api/vault-protocol/dual-root-rotation/rotationIdentifierSchema';
import { rotationPublicKeySchema } from '#shared/api/vault-protocol/dual-root-rotation/rotationPublicKeySchema';

export const rotationTranscriptSchema = z
  .object({
    accountId: rotationIdentifierSchema,
    workspaceId: rotationIdentifierSchema,
    vaultId: z.uuid(),
    deviceId: rotationIdentifierSchema,
    currentKeyId: rotationIdentifierSchema,
    nextKeyId: rotationIdentifierSchema,
    challenge: z
      .string()
      .length(rotationTranscriptFormat.challengeLength)
      .regex(rotationChallengePattern),
    expiresAt: z.iso.datetime(),
    currentRecoveryPublicKey: rotationPublicKeySchema,
    nextRecoveryPublicKey: rotationPublicKeySchema,
    signingPublicKey: z
      .string()
      .min(1)
      .max(rotationTranscriptFormat.maxPublicKeyLength),
    envelopePurpose: z.enum(['device-wrap', 'passkey-wrap']),
    envelope: z.string().min(1).max(rotationTranscriptFormat.maxEnvelopeLength),
    passkeyEnvelope: z
      .string()
      .min(1)
      .max(rotationTranscriptFormat.maxEnvelopeLength)
      .optional(),
  })
  .strict()
  .refine((value) => value.currentKeyId !== value.nextKeyId)
  .refine(
    (value) => value.currentRecoveryPublicKey !== value.nextRecoveryPublicKey,
  )
  .refine(
    (value) =>
      value.envelopePurpose !== 'passkey-wrap' ||
      value.passkeyEnvelope === undefined,
  )
  .refine(isRotationTranscriptWithinLimit);
