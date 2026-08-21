import { z } from 'zod';

export const deleteAccountSchema = z
  .object({
    password: z.string().min(1),
  })
  .strict();

export type DeleteAccountDto = z.infer<typeof deleteAccountSchema>;
