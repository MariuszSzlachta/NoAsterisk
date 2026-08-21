import { z } from 'zod';

/**
 * Validates partial preferences update — all fields optional.
 * At least one field must be provided (refine).
 */
export const updatePreferencesSchema = z
  .object({
    currency: z.enum(['PLN', 'EUR', 'USD', 'GBP']).optional(),
    dateFormat: z.enum(['DD.MM.YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY']).optional(),
    language: z.enum(['pl', 'en']).optional(),
    theme: z.enum(['dark', 'light', 'system']).optional(),
    homePage: z.enum(['dashboard', 'transactions', 'import']).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one preference field must be provided',
  });

export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;
