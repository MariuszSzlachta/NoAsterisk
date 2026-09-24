import { isRotationDtoWithinLimit } from '@vault-protocol/presentation/dto/dual-root-rotation/isRotationDtoWithinLimit';
import { z } from 'zod';
import { dualRootRotationDtoLimits } from '@vault-protocol/presentation/dto/dual-root-rotation/constants';
import { lowercaseHexPattern } from '@vault-protocol/presentation/dto/recovery-registration/patterns/lowercase-hex.pattern';
import { rotationChallengePattern } from '@vault-protocol/presentation/dto/dual-root-rotation/rotation-challenge.pattern';
export const finalizeRotationSchema = z
  .object({
    transcript: z
      .object({
        accountId: z.string().min(1).max(dualRootRotationDtoLimits.identifier),
        workspaceId: z
          .string()
          .min(1)
          .max(dualRootRotationDtoLimits.identifier),
        vaultId: z.uuid(),
        deviceId: z.string().min(1).max(dualRootRotationDtoLimits.identifier),
        currentKeyId: z
          .string()
          .min(1)
          .max(dualRootRotationDtoLimits.identifier),
        nextKeyId: z.string().min(1).max(dualRootRotationDtoLimits.identifier),
        challenge: z
          .string()
          .length(dualRootRotationDtoLimits.challenge)
          .regex(rotationChallengePattern),
        expiresAt: z.iso.datetime(),
        currentRecoveryPublicKey: z
          .string()
          .length(dualRootRotationDtoLimits.publicKey)
          .regex(lowercaseHexPattern),
        nextRecoveryPublicKey: z
          .string()
          .length(dualRootRotationDtoLimits.publicKey)
          .regex(lowercaseHexPattern),
        signingPublicKey: z
          .string()
          .min(1)
          .max(dualRootRotationDtoLimits.signingPublicKey),
        envelopePurpose: z.enum(['device-wrap', 'passkey-wrap']),
        envelope: z.string().min(1).max(dualRootRotationDtoLimits.envelope),
        passkeyEnvelope: z
          .string()
          .min(1)
          .max(dualRootRotationDtoLimits.envelope)
          .optional(),
      })
      .strict()
      .refine((value) => value.currentKeyId !== value.nextKeyId)
      .refine(
        (value) =>
          value.currentRecoveryPublicKey !== value.nextRecoveryPublicKey,
      )
      .refine(
        (value) =>
          value.envelopePurpose !== 'passkey-wrap' ||
          value.passkeyEnvelope === undefined,
      )
      .refine(isRotationDtoWithinLimit),
    deviceSignature: z
      .string()
      .length(dualRootRotationDtoLimits.signature)
      .regex(lowercaseHexPattern),
    recoverySignature: z
      .string()
      .length(dualRootRotationDtoLimits.signature)
      .regex(lowercaseHexPattern),
  })
  .strict();
