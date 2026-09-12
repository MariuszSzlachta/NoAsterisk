import { z } from 'zod';

import { enrollmentChallengePattern } from '#shared/adapters/vault-protocol/enrollment-transcript/challenge.pattern';
import { enrollmentTranscriptFormat } from '#shared/adapters/vault-protocol/enrollment-transcript/constants';

export const enrollmentTranscriptBaseSchema = z
  .object({
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
    keyId: z
      .string()
      .min(1)
      .max(enrollmentTranscriptFormat.maxIdentifierLength),
    deviceId: z
      .string()
      .min(1)
      .max(enrollmentTranscriptFormat.maxIdentifierLength),
    challenge: z
      .string()
      .length(enrollmentTranscriptFormat.challengeLength)
      .regex(enrollmentChallengePattern),
    createdAt: z
      .number()
      .int()
      .nonnegative()
      .max(enrollmentTranscriptFormat.maxTimestampMs),
    expiresAt: z
      .number()
      .int()
      .nonnegative()
      .max(enrollmentTranscriptFormat.maxTimestampMs),
    signingPublicKey: z
      .string()
      .min(2)
      .max(enrollmentTranscriptFormat.maxPublicKeyLength),
    deviceEnvelope: z
      .string()
      .min(2)
      .max(enrollmentTranscriptFormat.maxEnvelopeLength),
    passkeyEnvelope: z
      .string()
      .min(2)
      .max(enrollmentTranscriptFormat.maxEnvelopeLength)
      .optional(),
  })
  .strict();
