import { z } from 'zod';

import { enrollmentChallengePattern } from '#shared/adapters/vault-protocol/enrollment-transcript/challenge.pattern';
import { enrollmentTranscriptFormat } from '#shared/adapters/vault-protocol/enrollment-transcript/constants';
import { enrollmentHexPattern } from '#shared/adapters/vault-protocol/enrollment-transcript/hex.pattern';

export const recoveryRegistrationSchema = z.strictObject({
  accountId: z
    .string()
    .min(1)
    .max(enrollmentTranscriptFormat.maxIdentifierLength),
  workspaceId: z
    .string()
    .min(1)
    .max(enrollmentTranscriptFormat.maxIdentifierLength),
  vaultId: z
    .string()
    .min(1)
    .max(enrollmentTranscriptFormat.maxIdentifierLength),
  keyId: z.string().min(1).max(enrollmentTranscriptFormat.maxIdentifierLength),
  deviceId: z
    .string()
    .min(1)
    .max(enrollmentTranscriptFormat.maxIdentifierLength),
  challenge: z
    .string()
    .length(enrollmentTranscriptFormat.challengeLength)
    .regex(enrollmentChallengePattern),
  expiresAt: z.iso.datetime({ precision: 3 }),
  signingPublicKey: z
    .string()
    .min(2)
    .max(enrollmentTranscriptFormat.maxPublicKeyLength),
  recoveryPublicKey: z
    .string()
    .length(enrollmentTranscriptFormat.digestLength)
    .regex(enrollmentHexPattern),
});
