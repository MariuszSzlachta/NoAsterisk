import { z } from 'zod';

export const addEntrySchema = z
  .object({
    type: z.enum(['FirstName', 'Surname', 'Merchant', 'City', 'Phrase']),
    value: z.string().min(1).max(255),
  })
  .strict();

export type AddEntryDto = z.infer<typeof addEntrySchema>;
