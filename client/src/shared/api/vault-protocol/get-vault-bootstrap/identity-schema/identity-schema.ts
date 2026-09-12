import { z } from 'zod';

import { vaultBootstrapContract } from '#shared/api/vault-protocol/get-vault-bootstrap/constants';

export const vaultBootstrapIdentitySchema = z.strictObject({
  deviceId: z.string().min(1).max(vaultBootstrapContract.maxIdentifierLength),
  protocolVersion: z.literal(2),
  cryptoSuite: z.literal('HKDF-SHA256/AES-256-GCM'),
});
