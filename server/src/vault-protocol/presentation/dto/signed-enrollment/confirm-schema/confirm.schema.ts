import { z } from 'zod';
import { signedEnrollmentDtoLimits } from '@vault-protocol/presentation/dto/signed-enrollment/constants';
import { signedEnrollmentHexPattern } from '@vault-protocol/presentation/dto/signed-enrollment/hex.pattern';
import { signedEnrollmentChallengePattern } from '@vault-protocol/presentation/dto/signed-enrollment/challenge.pattern';

export const confirmSignedEnrollmentSchema = z
  .object({
    vaultId: z.uuid(),
    keyId: z.string().min(1).max(signedEnrollmentDtoLimits.id),
    deviceId: z.string().min(1).max(signedEnrollmentDtoLimits.id),
    challenge: z
      .string()
      .length(signedEnrollmentDtoLimits.challenge)
      .regex(signedEnrollmentChallengePattern),
    digest: z
      .string()
      .length(signedEnrollmentDtoLimits.digest)
      .regex(signedEnrollmentHexPattern),
    signature: z
      .string()
      .length(signedEnrollmentDtoLimits.signature)
      .regex(signedEnrollmentHexPattern),
  })
  .strict();
