import { z } from 'zod';

import { enrollmentHexPattern } from '#shared/adapters/vault-protocol/enrollment-transcript/hex.pattern';

export const rotationProofSchema = z
  .object({
    deviceSignature: z.string().length(128).regex(enrollmentHexPattern),
    recoverySignature: z.string().length(128).regex(enrollmentHexPattern),
  })
  .strict();
