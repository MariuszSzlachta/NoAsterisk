import { z } from 'zod';

import { enrollmentTranscriptSchema } from '#shared/adapters/vault-protocol/enrollment-transcript/schema';
import { signedTrustedQrFormat } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/constants';

export const signedTrustedRequestSchema = z
  .object({
    kind: z.literal(signedTrustedQrFormat.kind),
    formatVersion: z.literal(signedTrustedQrFormat.version),
    intent: enrollmentTranscriptSchema,
    transferRequest: z.unknown(),
  })
  .strict();
