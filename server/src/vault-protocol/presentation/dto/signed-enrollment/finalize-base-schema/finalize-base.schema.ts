import { z } from 'zod';
import { signedEnrollmentDtoLimits } from '@vault-protocol/presentation/dto/signed-enrollment/constants';
import { signedEnrollmentHexPattern } from '@vault-protocol/presentation/dto/signed-enrollment/hex.pattern';
import { signedEnrollmentChallengePattern } from '@vault-protocol/presentation/dto/signed-enrollment/challenge.pattern';

export const finalizeSignedEnrollmentBaseSchema = z
  .object({
    vaultId: z.uuid(),
    keyId: z.string().min(1).max(signedEnrollmentDtoLimits.id),
    deviceId: z.string().min(1).max(signedEnrollmentDtoLimits.id),
    challenge: z
      .string()
      .length(signedEnrollmentDtoLimits.challenge)
      .regex(signedEnrollmentChallengePattern),
    deviceEnvelope: z.string().min(2).max(signedEnrollmentDtoLimits.envelope),
    passkeyEnvelope: z
      .string()
      .min(2)
      .max(signedEnrollmentDtoLimits.envelope)
      .optional(),
    deviceSignature: z
      .string()
      .length(signedEnrollmentDtoLimits.signature)
      .regex(signedEnrollmentHexPattern),
  })
  .strict();
