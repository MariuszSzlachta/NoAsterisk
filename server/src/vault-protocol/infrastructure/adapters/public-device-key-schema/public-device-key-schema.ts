import { z } from 'zod';

export const publicDeviceKeySchema = z.strictObject({
  kty: z.literal('EC'),
  crv: z.literal('P-256'),
  x: z.base64url().length(43),
  y: z.base64url().length(43),
  ext: z.literal(true).optional(),
  key_ops: z.array(z.literal('verify')).length(1).optional(),
  alg: z.literal('ES256').optional(),
});
