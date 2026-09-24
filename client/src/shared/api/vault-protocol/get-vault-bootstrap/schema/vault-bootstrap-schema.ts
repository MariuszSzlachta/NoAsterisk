import { z } from 'zod';

import { vaultBootstrapContract } from '#shared/api/vault-protocol/get-vault-bootstrap/constants';
import { vaultBootstrapIdentitySchema } from '#shared/api/vault-protocol/get-vault-bootstrap/identity-schema';
import { bootstrapRecoveryPublicKeyPattern } from '#shared/api/vault-protocol/get-vault-bootstrap/schema/recovery-public-key.pattern';

export const vaultBootstrapSchema = z.discriminatedUnion('status', [
  vaultBootstrapIdentitySchema.extend({ status: z.literal('empty') }),
  vaultBootstrapIdentitySchema.extend({
    status: z.literal('enrollment-required'),
    vaultId: z
      .string()
      .min(1)
      .max(vaultBootstrapContract.maxIdentifierLength)
      .optional(),
    keyId: z
      .string()
      .min(1)
      .max(vaultBootstrapContract.maxIdentifierLength)
      .optional(),
    recoveryPublicKey: z
      .string()
      .length(vaultBootstrapContract.recoveryPublicKeyLength)
      .regex(bootstrapRecoveryPublicKeyPattern)
      .optional(),
  }),
  vaultBootstrapIdentitySchema
    .extend({
      status: z.literal('available'),
      vaultId: z
        .string()
        .min(1)
        .max(vaultBootstrapContract.maxIdentifierLength),
      keyId: z.string().min(1).max(vaultBootstrapContract.maxIdentifierLength),
      securityProfile: z.enum(['standard', 'high-security']),
      deviceEnvelope: z
        .string()
        .min(2)
        .max(vaultBootstrapContract.maxEnvelopeLength)
        .optional(),
      passkeyEnvelope: z
        .string()
        .min(2)
        .max(vaultBootstrapContract.maxEnvelopeLength)
        .optional(),
      recoveryPublicKey: z
        .string()
        .length(vaultBootstrapContract.recoveryPublicKeyLength)
        .regex(bootstrapRecoveryPublicKeyPattern)
        .optional(),
    })
    .refine(
      (metadata) =>
        metadata.deviceEnvelope !== undefined ||
        metadata.passkeyEnvelope !== undefined,
    ),
]);
