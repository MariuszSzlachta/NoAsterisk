import { z } from 'zod';
export const encryptedEnrollmentShareSchema = z
  .object({
    ciphertext: z.string(),
    nonce: z.string(),
    authTag: z.string(),
    infrastructureKeyVersion: z.number().int(),
  })
  .strict();
