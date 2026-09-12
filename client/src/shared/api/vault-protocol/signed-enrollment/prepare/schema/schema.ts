import { z } from 'zod';

import { enrollmentTranscriptSchema } from '#shared/adapters/vault-protocol/enrollment-transcript/schema';

export const signedEnrollmentPreparationSchema = z
  .object({
    intent: enrollmentTranscriptSchema,
    serverShare: z.base64().length(44),
  })
  .strict();
