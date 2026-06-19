import { z } from 'zod';

export const CreateTransactionDto = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1),
  description: z.string().max(1000),
  date: z.coerce.date(),
});

export type CreateTransactionDto = z.infer<typeof CreateTransactionDto>;
