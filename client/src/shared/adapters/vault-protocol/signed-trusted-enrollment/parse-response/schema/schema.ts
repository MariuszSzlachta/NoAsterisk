import { z } from 'zod';

import { enrollmentHexPattern } from '#shared/adapters/vault-protocol/enrollment-transcript/hex.pattern';
import { enrollmentTranscriptSchema } from '#shared/adapters/vault-protocol/enrollment-transcript/schema';
import { signedTrustedQrFormat } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/constants';

export const signedTrustedResponseSchema = z
  .object({
    kind: z.literal(signedTrustedQrFormat.kind),
    formatVersion: z.literal(signedTrustedQrFormat.version),
    intent: enrollmentTranscriptSchema,
    transferResponse: z.unknown(),
    delegationSignature: z
      .string()
      .length(signedTrustedQrFormat.signatureLength)
      .regex(enrollmentHexPattern),
  })
  .strict();
