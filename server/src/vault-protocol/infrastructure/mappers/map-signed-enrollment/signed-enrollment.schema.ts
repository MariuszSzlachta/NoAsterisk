import { z } from 'zod';

export const signedEnrollmentStorageSchema = z
  .object({
    intent: z.discriminatedUnion('purpose', [
      z
        .object({
          purpose: z.enum(['initial', 'recovery']),
          accountId: z.string(),
          workspaceId: z.string(),
          vaultId: z.string(),
          keyId: z.string(),
          deviceId: z.string(),
          challenge: z.string(),
          createdAt: z.number(),
          expiresAt: z.number(),
          signingPublicKey: z.string(),
          recoveryPublicKey: z.string(),
          deviceEnvelope: z.string(),
        })
        .strict(),
      z
        .object({
          purpose: z.literal('trusted'),
          accountId: z.string(),
          workspaceId: z.string(),
          vaultId: z.string(),
          keyId: z.string(),
          deviceId: z.string(),
          challenge: z.string(),
          createdAt: z.number(),
          expiresAt: z.number(),
          signingPublicKey: z.string(),
          oldDeviceId: z.string(),
          newEphemeralPublicKey: z.string(),
          delegationDigest: z.string(),
          deviceEnvelope: z.string(),
        })
        .strict(),
    ]),
    state: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('pending') }).strict(),
      z.object({ kind: z.literal('finalized'), digest: z.string() }).strict(),
      z.object({ kind: z.literal('active'), digest: z.string() }).strict(),
    ]),
  })
  .strict();
