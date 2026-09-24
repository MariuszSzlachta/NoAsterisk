import { z } from 'zod';
import { dualRootRotationDtoLimits } from '@vault-protocol/presentation/dto/dual-root-rotation/constants';
import { lowercaseHexPattern } from '@vault-protocol/presentation/dto/recovery-registration/patterns/lowercase-hex.pattern';
export const prepareRotationSchema = z
  .object({
    vaultId: z.uuid(),
    deviceId: z.string().min(1).max(dualRootRotationDtoLimits.identifier),
    currentKeyId: z.string().min(1).max(dualRootRotationDtoLimits.identifier),
    nextKeyId: z.string().min(1).max(dualRootRotationDtoLimits.identifier),
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
  .strict();
