import { z } from 'zod';

export const createRuleSchema = z.object({
  keyword: z.string().min(1).max(255),
  categoryId: z.string().uuid(),
  matcherType: z.enum(['Contains', 'Exact']),
  priority: z.number().int().min(0).optional(),
}).strict();

export type CreateRuleDto = z.infer<typeof createRuleSchema>;

export const updateRuleSchema = z
  .object({
    keyword: z.string().min(1).max(255).optional(),
    categoryId: z.string().uuid().optional(),
    matcherType: z.enum(['Contains', 'Exact']).optional(),
    priority: z.number().int().min(0).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateRuleDto = z.infer<typeof updateRuleSchema>;

export const ruleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type RuleQueryDto = z.infer<typeof ruleQuerySchema>;
