import { z } from 'zod';
import type { UserPreferences } from '@auth/domain/user-preferences.vo';

const userPreferencesSchema = z.object({
  currency: z.enum(['PLN', 'EUR', 'USD', 'GBP']),
  dateFormat: z.enum(['DD.MM.YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY']),
  language: z.enum(['pl', 'en']),
  theme: z.enum(['dark', 'light', 'system']),
  homePage: z.enum(['dashboard', 'transactions', 'import']),
});

export const parseUserPreferences = (value: unknown): UserPreferences => {
  const result = userPreferencesSchema.safeParse(value);
  if (!result.success) {
    throw new Error('Corrupted DB data: invalid user preferences');
  }
  return result.data;
};
