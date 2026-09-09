import { z } from 'zod';

/**
 * Password strength: min 8 chars, max 128,
 * must contain: uppercase, lowercase, digit, special character.
 * Aligns with OWASP ASVS 2.1.7 password complexity requirements.
 */
const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

export const registerSchema = z
  .object({
    email: z.email(),
    password: strongPassword,
    inviteCode: z
      .string()
      .regex(/^[A-Z0-9]{6,8}$/)
      .optional(),
    privacyPolicyVersion: z.string().max(64),
    termsVersion: z.string().max(64),
  })
  .strict();

export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1),
  })
  .strict();

export type LoginDto = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({}).strict();

export type RefreshDto = z.infer<typeof refreshSchema>;
