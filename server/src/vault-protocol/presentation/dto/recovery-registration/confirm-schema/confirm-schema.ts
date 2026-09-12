import { z } from 'zod';
import { lowercaseHexPattern } from '@vault-protocol/presentation/dto/recovery-registration/patterns/lowercase-hex.pattern';
import { challengePattern } from '@vault-protocol/presentation/dto/recovery-registration/patterns/challenge.pattern';

export const confirmRecoveryRegistrationSchema = z.strictObject({
  vaultId: z.uuid(),
  keyId: z.string().min(1).max(128),
  deviceId: z.string().min(1).max(128),
  challenge: z.string().length(43).regex(challengePattern),
  deviceSignature: z.string().length(128).regex(lowercaseHexPattern),
  recoverySignature: z.string().length(128).regex(lowercaseHexPattern),
});
