import { ed25519 } from '@noble/curves/ed25519.js';
import { eq } from 'drizzle-orm';
import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { vaultKeysets } from '@shared/infrastructure/database/schema';
import { buildPostgresRecoveryFixture } from '@vault-protocol/testing/build-postgres-recovery-fixture';
import type { PostgresRecoveryFixture } from '@vault-protocol/testing/build-postgres-recovery-fixture/types';
import type { PrepareDualRootRotationRequest } from '@vault-protocol/domain/ports/dual-root-rotation';
import type { PostgresRotationFixture } from '@vault-protocol/testing/buildPostgresRotationFixture/types';
export const buildPostgresRotationFixture = async (
  database: DrizzleDatabase,
): Promise<PostgresRotationFixture> => {
  const fixture: PostgresRecoveryFixture =
    await buildPostgresRecoveryFixture(database);
  await database
    .update(vaultKeysets)
    .set({ recoveryPublicKey: fixture.signature.recoveryPublicKey })
    .where(eq(vaultKeysets.id, fixture.keysetId));
  const nextSeed = fixture.signature.recoverySeed.map((value) => value + 1);
  const nextPublicKey = Buffer.from(ed25519.getPublicKey(nextSeed)).toString(
    'hex',
  );
  const request: PrepareDualRootRotationRequest = {
    userId: fixture.scope.userId,
    workspaceId: fixture.scope.workspaceId,
    vaultId: fixture.scope.vaultId,
    deviceId: fixture.scope.deviceId,
    currentKeyId: fixture.scope.keyId,
    nextKeyId: 'next-key',
    nextRecoveryPublicKey: nextPublicKey,
    signingPublicKey: fixture.signature.devicePublicKey,
    envelopePurpose: 'device-wrap',
    envelope: 'opaque-next-envelope',
    passkeyEnvelope: 'opaque-secondary-envelope',
  };
  return {
    ...fixture,
    request,
    nextSignature: {
      ...fixture.signature,
      recoverySeed: nextSeed,
      recoveryPublicKey: nextPublicKey,
    },
  };
};
