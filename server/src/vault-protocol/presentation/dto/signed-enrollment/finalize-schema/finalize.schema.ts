import { z } from 'zod';
import { finalizeSignedEnrollmentBaseSchema } from '@vault-protocol/presentation/dto/signed-enrollment/finalize-base-schema';
import { signedEnrollmentDtoLimits } from '@vault-protocol/presentation/dto/signed-enrollment/constants';
import { signedEnrollmentHexPattern } from '@vault-protocol/presentation/dto/signed-enrollment/hex.pattern';

export const finalizeSignedEnrollmentSchema = z.discriminatedUnion('purpose', [
  finalizeSignedEnrollmentBaseSchema.extend({
    purpose: z.enum(['initial', 'recovery']),
    recoverySignature: z
      .string()
      .length(signedEnrollmentDtoLimits.signature)
      .regex(signedEnrollmentHexPattern),
  }),
  finalizeSignedEnrollmentBaseSchema.extend({
    purpose: z.literal('trusted'),
    delegationSignature: z
      .string()
      .length(signedEnrollmentDtoLimits.signature)
      .regex(signedEnrollmentHexPattern),
    delegationDigest: z
      .string()
      .length(signedEnrollmentDtoLimits.digest)
      .regex(signedEnrollmentHexPattern),
  }),
]);
