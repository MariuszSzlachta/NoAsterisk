import { randomUUID } from 'node:crypto';
import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import {
  users,
  vaultDeviceEnvelopes,
  vaultDevices,
  vaultKeysets,
  vaults,
  workspaces,
} from '@shared/infrastructure/database/schema';
import type { PostgresRecoveryFixture } from '@vault-protocol/testing/build-postgres-recovery-fixture/types';
import { buildVaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture';

export const buildPostgresRecoveryFixture = async (
  database: DrizzleDatabase,
): Promise<PostgresRecoveryFixture> => {
  const scope = {
    userId: randomUUID(),
    workspaceId: randomUUID(),
    vaultId: randomUUID(),
    keyId: 'synthetic-key',
    deviceId: 'synthetic-device',
  };
  const keysetId = randomUUID();
  const deviceRowId = randomUUID();
  const signature = buildVaultSignatureFixture();
  const now = new Date();
  await database.transaction(async (transaction) => {
    await transaction.insert(workspaces).values({
      id: scope.workspaceId,
      name: 'Isolated security test',
      createdAt: now,
    });
    await transaction.insert(users).values({
      id: scope.userId,
      email: `${scope.userId}@vault-security.test`,
      passwordHash: 'synthetic-no-account-password',
      role: 'Member',
      workspaceId: scope.workspaceId,
      createdAt: now,
    });
    await transaction.insert(vaults).values({
      id: scope.vaultId,
      workspaceId: scope.workspaceId,
      encryptedBlob: 'opaque-financial-fixture',
      contentHash: 'synthetic-hash',
      byteSize: 24,
      revision: 7,
      createdAt: now,
      updatedAt: now,
    });
    await transaction.insert(vaultKeysets).values({
      id: keysetId,
      vaultId: scope.vaultId,
      keyId: scope.keyId,
      protocolVersion: '2',
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      createdAt: now,
      updatedAt: now,
    });
    await transaction.insert(vaultDevices).values({
      id: deviceRowId,
      userId: scope.userId,
      keysetId,
      deviceId: scope.deviceId,
      signingPublicKey: signature.devicePublicKey,
      status: 'active',
      revoked: false,
      createdAt: now,
      lastSeenAt: now,
    });
    await transaction.insert(vaultDeviceEnvelopes).values({
      id: randomUUID(),
      deviceId: deviceRowId,
      keysetId,
      purpose: 'device-wrap',
      envelope: 'opaque-device-envelope-fixture',
      protocolVersion: '2',
      createdAt: now,
      updatedAt: now,
    });
  });
  return { scope, keysetId, deviceRowId, signature };
};
