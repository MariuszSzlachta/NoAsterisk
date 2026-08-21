import { z } from 'zod';

export const uploadVaultSchema = z
  .object({
    encryptedBlob: z.string().min(1).max(10_000_000),
  })
  .strict();

export type UploadVaultDto = z.infer<typeof uploadVaultSchema>;
