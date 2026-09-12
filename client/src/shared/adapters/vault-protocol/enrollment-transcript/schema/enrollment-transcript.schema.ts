import { z } from 'zod';

import { enrollmentTranscriptBaseSchema } from '#shared/adapters/vault-protocol/enrollment-transcript/base-schema';
import { enrollmentTranscriptFormat } from '#shared/adapters/vault-protocol/enrollment-transcript/constants';
import { enrollmentHexPattern } from '#shared/adapters/vault-protocol/enrollment-transcript/hex.pattern';

export const enrollmentTranscriptSchema = z
  .discriminatedUnion('purpose', [
    enrollmentTranscriptBaseSchema.extend({
      purpose: z.enum(['initial', 'recovery']),
      recoveryPublicKey: z
        .string()
        .length(enrollmentTranscriptFormat.digestLength)
        .regex(enrollmentHexPattern),
    }),
    enrollmentTranscriptBaseSchema.extend({
      purpose: z.literal('trusted'),
      oldDeviceId: z
        .string()
        .min(1)
        .max(enrollmentTranscriptFormat.maxIdentifierLength),
      newEphemeralPublicKey: z
        .string()
        .min(2)
        .max(enrollmentTranscriptFormat.maxPublicKeyLength),
      delegationDigest: z
        .string()
        .length(enrollmentTranscriptFormat.digestLength)
        .regex(enrollmentHexPattern),
    }),
  ])
  .refine(
    (value) =>
      value.expiresAt - value.createdAt === enrollmentTranscriptFormat.ttlMs &&
      (value.purpose !== 'trusted' || value.oldDeviceId !== value.deviceId),
  );
