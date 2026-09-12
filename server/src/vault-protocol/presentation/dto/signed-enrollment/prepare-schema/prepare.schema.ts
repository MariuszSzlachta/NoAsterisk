import { z } from 'zod';
import { signedEnrollmentDtoLimits } from '@vault-protocol/presentation/dto/signed-enrollment/constants';
import { signedEnrollmentHexPattern } from '@vault-protocol/presentation/dto/signed-enrollment/hex.pattern';

export const prepareSignedEnrollmentSchema = z
  .object({
    recoveryConfirmed: z.literal(true),
    intent: z.discriminatedUnion('purpose', [
      z
        .object({
          purpose: z.enum(['initial', 'recovery']),
          vaultId: z.uuid(),
          keyId: z.string().min(1).max(signedEnrollmentDtoLimits.id),
          deviceId: z.string().min(1).max(signedEnrollmentDtoLimits.id),
          signingPublicKey: z
            .string()
            .min(2)
            .max(signedEnrollmentDtoLimits.publicKey),
          recoveryPublicKey: z
            .string()
            .length(signedEnrollmentDtoLimits.digest)
            .regex(signedEnrollmentHexPattern),
        })
        .strict(),
      z
        .object({
          purpose: z.literal('trusted'),
          vaultId: z.uuid(),
          keyId: z.string().min(1).max(signedEnrollmentDtoLimits.id),
          deviceId: z.string().min(1).max(signedEnrollmentDtoLimits.id),
          signingPublicKey: z
            .string()
            .min(2)
            .max(signedEnrollmentDtoLimits.publicKey),
          oldDeviceId: z.string().min(1).max(signedEnrollmentDtoLimits.id),
          newEphemeralPublicKey: z
            .string()
            .min(2)
            .max(signedEnrollmentDtoLimits.publicKey),
        })
        .strict(),
    ]),
  })
  .strict();
