import { z } from 'zod';
import type { TokenPayload } from '@auth/domain/ports/token.port';

const tokenPayloadSchema = z
  .object({
    iat: z.number().int().nonnegative().optional(),
    exp: z.number().int().nonnegative().optional(),
    sub: z.string().min(1),
    workspaceId: z.string().min(1),
    role: z.string().min(1),
    tokenVersion: z.number().int(),
    authTime: z.number().int().optional(),
    amr: z.enum(['password', 'webauthn']).optional(),
    vaultUnlockGrant: z.string().optional(),
  })
  .strict();

export const parseTokenPayload = (value: unknown): TokenPayload | undefined => {
  const result = tokenPayloadSchema.safeParse(value);
  return result.success ? result.data : undefined;
};
