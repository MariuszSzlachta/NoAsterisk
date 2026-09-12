import { z } from 'zod';

const hash = z.string().regex(/^[A-Za-z0-9+/=_-]{0,256}$/);

export const syncSnapshotSchema = z
  .object({
    vaultId: z.string().min(1).max(128),
    keyId: z.string().min(1).max(128),
    deviceId: z.string().min(1).max(128),
    revision: z.number().int().positive(),
    previousEnvelopeHash: hash,
    envelopeHash: hash,
    header: z.string().min(2).max(20_000),
    ciphertext: z.string().min(1).max(8_000_000),
    signature: z.string().min(1).max(4_000),
    signingPublicKey: z.string().min(2).max(4_000),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict();
