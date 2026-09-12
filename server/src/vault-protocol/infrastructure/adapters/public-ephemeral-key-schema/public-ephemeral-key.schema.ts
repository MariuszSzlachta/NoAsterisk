import { z } from 'zod';
import { publicDeviceKeySchema } from '@vault-protocol/infrastructure/adapters/public-device-key-schema';

export const publicEphemeralKeySchema = publicDeviceKeySchema
  .omit({ key_ops: true, alg: true })
  .extend({ key_ops: z.array(z.never()).length(0).optional() });
