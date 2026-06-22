import { z } from 'zod';

const ImportTransactionRowDto = z.object({
  amount: z.number(),
  currency: z.string().min(3).max(3),
  type: z.enum(['income', 'expense']),
  description: z.string().min(1).max(2000),
  date: z.coerce.date(),
  categoryIds: z.array(z.string().uuid()).max(10).default([]),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();

export const ImportTransactionsDto = z.object({
  batchId: z.string().uuid(),
  batchHash: z.string().regex(/^[a-f0-9]{64}$/),
  sourceFilename: z
    .string()
    .max(255)
    .regex(/^[^/\\<>:"|?*]+$/)
    .optional(),
  rows: z.array(ImportTransactionRowDto).min(1).max(200),
  isRetry: z.boolean().optional(),
}).strict();

export type ImportTransactionsDto = z.infer<typeof ImportTransactionsDto>;
