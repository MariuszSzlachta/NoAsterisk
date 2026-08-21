import { z } from 'zod';

/**
 * Empty string = clear displayName (sets to undefined).
 * Non-empty string = set displayName (trimmed, max 50 chars).
 */
export const updateProfileSchema = z
  .object({
    displayName: z.string().max(50),
  })
  .strict();

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
