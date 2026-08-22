import { z } from 'zod';

export const generateCodeSchema = z
  .object({
    expiresAt: z.iso.datetime().optional(),
  })
  .strict();

export type GenerateCodeDto = z.infer<typeof generateCodeSchema>;
