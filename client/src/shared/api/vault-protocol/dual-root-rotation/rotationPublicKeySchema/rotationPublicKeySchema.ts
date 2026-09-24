import { z } from 'zod';

import { rotationTranscriptFormat } from '#shared/adapters/vault-protocol/rotation-transcript/constants';
import { rotationRecoveryPublicKeyPattern } from '#shared/adapters/vault-protocol/rotation-transcript/patterns/recovery-public-key.pattern';

export const rotationPublicKeySchema = z
  .string()
  .length(rotationTranscriptFormat.recoveryPublicKeyLength)
  .regex(rotationRecoveryPublicKeyPattern);
