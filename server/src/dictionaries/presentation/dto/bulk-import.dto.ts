import { z } from 'zod';

export const bulkImportSchema = z
  .object({
    type: z.enum(['FirstName', 'Surname', 'Merchant', 'City', 'Phrase']),
    values: z.array(z.string().min(1).max(255)).min(1).max(5000),
  })
  .strict();

export type BulkImportDto = z.infer<typeof bulkImportSchema>;
