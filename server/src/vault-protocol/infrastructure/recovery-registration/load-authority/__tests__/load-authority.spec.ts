import { eq } from 'drizzle-orm';
import type { Pool } from 'pg';
import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { vaultDevices } from '@shared/infrastructure/database/schema';
import { loadRecoveryRegistrationAuthority } from '@vault-protocol/infrastructure/recovery-registration/load-authority';
import { buildPostgresRecoveryFixture } from '@vault-protocol/testing/build-postgres-recovery-fixture';
import { createVaultSecurityTestConnection } from '@vault-protocol/testing/vault-security-test-connection';

const describePostgres =
  process.env.VAULT_SECURITY_TEST_DATABASE_NAME === undefined
    ? describe.skip
    : describe;

describePostgres('loadRecoveryRegistrationAuthority', () => {
  let pool: Pool | undefined;
  let database: DrizzleDatabase;
  beforeAll(async () => {
    const connection = await createVaultSecurityTestConnection();
    pool = connection.pool;
    database = connection.database;
  });
  afterAll(async () => {
    await pool?.end();
  });

  it('should select the exact account/workspace/vault/key/device and preserve SQL absence', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const authority = await database.transaction((transaction) =>
      loadRecoveryRegistrationAuthority(transaction, fixture.scope),
    );
    expect(authority).toEqual({
      ...fixture.scope,
      keysetId: fixture.keysetId,
      protocolVersion: '2',
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      signingPublicKey: fixture.signature.devicePublicKey,
      recoveryPublicKey: null,
      deviceStatus: 'active',
      isDeviceRevoked: false,
    });
  });

  it('should not return an authority for another account, key or device', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    await expect(
      database.transaction((transaction) =>
        loadRecoveryRegistrationAuthority(transaction, {
          ...fixture.scope,
          userId: '00000000-0000-4000-8000-000000000099',
        }),
      ),
    ).resolves.toBeUndefined();
    await expect(
      database.transaction((transaction) =>
        loadRecoveryRegistrationAuthority(transaction, {
          ...fixture.scope,
          keyId: 'other-key',
        }),
      ),
    ).resolves.toBeUndefined();
    await expect(
      database.transaction((transaction) =>
        loadRecoveryRegistrationAuthority(transaction, {
          ...fixture.scope,
          deviceId: 'other-device',
        }),
      ),
    ).resolves.toBeUndefined();
  });

  it('should preserve revoked status so the domain cannot authorize a stale prepared challenge', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    await database
      .update(vaultDevices)
      .set({ status: 'revoked', revoked: true })
      .where(eq(vaultDevices.id, fixture.deviceRowId));
    const authority = await database.transaction((transaction) =>
      loadRecoveryRegistrationAuthority(transaction, fixture.scope),
    );
    expect(authority).toMatchObject({
      deviceStatus: 'revoked',
      isDeviceRevoked: true,
    });
  });
});
