import { z } from 'zod';

export const CreateTransactionDto = z
  .object({
    accountId: z.uuid(),
    amount: z.number().positive(),
    currency: z.string().min(3).max(3),
    type: z.enum(['income', 'expense', 'adjustment']),
    categoryIds: z.array(z.uuid()).max(10).default([]),
    description: z.string().min(1).max(1000),
    date: z.coerce.date(),
  })
  .strict();

export type CreateTransactionDto = z.infer<typeof CreateTransactionDto>;

export const UpdateTransactionDto = z
  .object({
    amount: z.number().positive().optional(),
    currency: z.string().min(3).max(3).optional(),
    type: z.enum(['income', 'expense', 'adjustment']).optional(),
    categoryIds: z.array(z.uuid()).max(10).optional(),
    description: z.string().min(1).max(1000).optional(),
    date: z.coerce.date().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateTransactionDto = z.infer<typeof UpdateTransactionDto>;

export const TransactionQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['date', 'amount', 'type', 'createdAt']).default('date'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  type: z.enum(['income', 'expense', 'adjustment']).optional(),
  categoryIds: z
    .union([z.uuid(), z.array(z.uuid()).max(10)])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
  description: z.string().max(255).optional(),
});

export type TransactionQueryDto = z.infer<typeof TransactionQueryDto>;
