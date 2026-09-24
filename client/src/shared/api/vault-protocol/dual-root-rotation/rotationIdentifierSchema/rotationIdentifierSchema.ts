import { z } from 'zod';

import { rotationTranscriptFormat } from '#shared/adapters/vault-protocol/rotation-transcript/constants';

export const rotationIdentifierSchema = z
  .string()
  .min(1)
  .max(rotationTranscriptFormat.maxIdentifierLength);
