import { z } from 'zod';
import { lowercaseHexPattern } from '@vault-protocol/presentation/dto/recovery-registration/patterns/lowercase-hex.pattern';

export const prepareRecoveryRegistrationSchema = z.strictObject({
  vaultId: z.uuid(),
  keyId: z.string().min(1).max(128),
  deviceId: z.string().min(1).max(128),
  recoveryPublicKey: z.string().length(64).regex(lowercaseHexPattern),
  recoveryConfirmed: z.literal(true),
});
