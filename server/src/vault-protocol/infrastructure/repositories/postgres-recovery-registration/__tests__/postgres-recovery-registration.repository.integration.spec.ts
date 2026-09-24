import { DomainError } from '@budget/domain';
import { and, eq } from 'drizzle-orm';
import type { Pool } from 'pg';
import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import {
  vaultKeysets,
  vaultRecoveryAuthorityChallenges,
  vaults,
} from '@shared/infrastructure/database/schema';
import { createPostgresTestConnection } from '@shared/testing/postgres-test-connection/create-postgres-test-connection';
import { ConfirmRecoveryRegistrationHandler } from '@vault-protocol/application/commands/confirm-recovery-registration';
import { VaultSignatureVerifierAdapter } from '@vault-protocol/infrastructure/adapters/vault-signature-verifier';
import { PostgresRecoveryRegistrationRepository } from '@vault-protocol/infrastructure/repositories/postgres-recovery-registration';
import { PostgresVaultBootstrapRepository } from '@vault-protocol/infrastructure/postgres-vault-bootstrap.repository';
import { PostgresVaultRotationRepository } from '@vault-protocol/infrastructure/postgres-vault-rotation.repository';
import { buildPostgresRecoveryFixture } from '@vault-protocol/testing/build-postgres-recovery-fixture';
import { signRecoveryRegistration } from '@vault-protocol/testing/sign-recovery-registration';
import { recoveryRegistrationFormat } from '@vault-protocol/domain/recovery-registration/constants';

describe('PostgresRecoveryRegistrationRepository', () => {
  it('should expose public recovery metadata and reject legacy rotation without losing its authority', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const repository = new PostgresRecoveryRegistrationRepository(database);
    const registration = await repository.prepare({
      ...fixture.scope,
      recoveryPublicKey: fixture.signature.recoveryPublicKey,
    });
    await new ConfirmRecoveryRegistrationHandler(
      repository,
      new VaultSignatureVerifierAdapter(),
    ).execute(signRecoveryRegistration(registration, fixture.signature));
    const bootstrap = new PostgresVaultBootstrapRepository(database);
    expect(
      await bootstrap.get(
        fixture.scope.userId,
        fixture.scope.workspaceId,
        fixture.scope.deviceId,
      ),
    ).toMatchObject({
      status: 'available',
      recoveryPublicKey: fixture.signature.recoveryPublicKey,
    });
    expect(
      await bootstrap.get(
        fixture.scope.userId,
        fixture.scope.workspaceId,
        'new-device',
      ),
    ).toMatchObject({
      status: 'enrollment-required',
      recoveryPublicKey: fixture.signature.recoveryPublicKey,
    });
    await expect(
      new PostgresVaultRotationRepository(database).rotate({
        userId: fixture.scope.userId,
        workspaceId: fixture.scope.workspaceId,
        vaultId: fixture.scope.vaultId,
        deviceId: fixture.scope.deviceId,
        currentKeyId: fixture.scope.keyId,
        nextKeyId: 'next-key',
        envelopePurpose: 'device-wrap',
        envelope: 'opaque-next-envelope',
        protocolVersion: '2',
        cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
        idempotencyKey: 'legacy-rotation',
      }),
    ).rejects.toThrow('Vault rotation requires recovery authority support');
    const keysets = await database
      .select()
      .from(vaultKeysets)
      .where(eq(vaultKeysets.id, fixture.keysetId));
    expect(keysets[0]?.keyId).toBe(fixture.scope.keyId);
    expect(keysets[0]?.recoveryPublicKey).toBe(
      fixture.signature.recoveryPublicKey,
    );
  });
  let pool: Pool | undefined;
  let database: DrizzleDatabase;

  beforeAll(async () => {
    const connection = await createPostgresTestConnection();
    pool = connection.pool;
    database = connection.database;
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
  afterAll(async () => {
    await pool?.end();
  });

  it('should register independent public authority without changing encrypted financial data', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const repository = new PostgresRecoveryRegistrationRepository(database);
    const registration = await repository.prepare({
      ...fixture.scope,
      recoveryPublicKey: fixture.signature.recoveryPublicKey,
    });
    const command = signRecoveryRegistration(registration, fixture.signature);
    await new ConfirmRecoveryRegistrationHandler(
      repository,
      new VaultSignatureVerifierAdapter(),
    ).execute(command);
    const keysets = await database
      .select()
      .from(vaultKeysets)
      .where(eq(vaultKeysets.id, fixture.keysetId));
    expect(keysets[0]?.recoveryPublicKey).toBe(
      fixture.signature.recoveryPublicKey,
    );
    const financial = await database
      .select()
      .from(vaults)
      .where(eq(vaults.id, fixture.scope.vaultId));
    expect(financial[0]?.encryptedBlob).toBe('opaque-financial-fixture');
    expect(financial[0]?.revision).toBe(7);
    await expect(
      repository.findPending(fixture.scope, registration.snapshot.challenge),
    ).resolves.toBeUndefined();
    await expect(
      new ConfirmRecoveryRegistrationHandler(
        repository,
        new VaultSignatureVerifierAdapter(),
      ).execute(command),
    ).rejects.toThrow(DomainError);
    await expect(
      repository.prepare({
        ...fixture.scope,
        recoveryPublicKey: 'b'.repeat(64),
      }),
    ).rejects.toThrow(DomainError);
  });

  it.each(['device', 'recovery'])(
    'should reject a wrong %s proof without consuming the legitimate challenge',
    async (proof) => {
      const fixture = await buildPostgresRecoveryFixture(database);
      const repository = new PostgresRecoveryRegistrationRepository(database);
      const registration = await repository.prepare({
        ...fixture.scope,
        recoveryPublicKey: fixture.signature.recoveryPublicKey,
      });
      const command = signRecoveryRegistration(registration, fixture.signature);
      const handler = new ConfirmRecoveryRegistrationHandler(
        repository,
        new VaultSignatureVerifierAdapter(),
      );
      await expect(
        handler.execute({
          ...command,
          ...(proof === 'device'
            ? { deviceSignature: '0'.repeat(128) }
            : { recoverySignature: '0'.repeat(128) }),
        }),
      ).rejects.toThrow(DomainError);
      expect(
        await repository.findPending(
          fixture.scope,
          registration.snapshot.challenge,
        ),
      ).toBeDefined();
      await handler.execute(command);
    },
  );

  it('should reject an old signature replayed against a different challenge', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const repository = new PostgresRecoveryRegistrationRepository(database);
    const first = await repository.prepare({
      ...fixture.scope,
      recoveryPublicKey: fixture.signature.recoveryPublicKey,
    });
    const second = await repository.prepare({
      ...fixture.scope,
      recoveryPublicKey: fixture.signature.recoveryPublicKey,
    });
    const command = signRecoveryRegistration(first, fixture.signature);
    await expect(
      new ConfirmRecoveryRegistrationHandler(
        repository,
        new VaultSignatureVerifierAdapter(),
      ).execute({ ...command, challenge: second.snapshot.challenge }),
    ).rejects.toThrow(DomainError);
    expect(
      await repository.findPending(fixture.scope, first.snapshot.challenge),
    ).toBeDefined();
  });

  it('should reject another workspace, key or device before issuing authority', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const repository = new PostgresRecoveryRegistrationRepository(database);
    await expect(
      repository.prepare({
        ...fixture.scope,
        workspaceId: '00000000-0000-4000-8000-000000000099',
        recoveryPublicKey: fixture.signature.recoveryPublicKey,
      }),
    ).rejects.toThrow(DomainError);
    await expect(
      repository.prepare({
        ...fixture.scope,
        keyId: 'other-key',
        recoveryPublicKey: fixture.signature.recoveryPublicKey,
      }),
    ).rejects.toThrow(DomainError);
    await expect(
      repository.prepare({
        ...fixture.scope,
        deviceId: 'other-device',
        recoveryPublicKey: fixture.signature.recoveryPublicKey,
      }),
    ).rejects.toThrow(DomainError);
  });

  it('should recheck revocation under the common lock after actual signature verification', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const repository = new PostgresRecoveryRegistrationRepository(database);
    const registration = await repository.prepare({
      ...fixture.scope,
      recoveryPublicKey: fixture.signature.recoveryPublicKey,
    });
    const command = signRecoveryRegistration(registration, fixture.signature);
    const verifier = new VaultSignatureVerifierAdapter();
    const originalVerify = verifier.verifyRecovery.bind(verifier);
    if (pool === undefined) throw new Error('Test pool is unavailable');
    let signalProofVerified: () => void = () => undefined;
    const proofVerified = new Promise<void>((resolve) => {
      signalProofVerified = resolve;
    });
    jest
      .spyOn(verifier, 'verifyRecovery')
      .mockImplementation(async (...args) => {
        const valid = await originalVerify(...args);
        signalProofVerified();
        return valid;
      });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [fixture.scope.vaultId],
      );
      const confirming = new ConfirmRecoveryRegistrationHandler(
        repository,
        verifier,
      ).execute(command);
      const expectedFailure = expect(confirming).rejects.toThrow(DomainError);
      await proofVerified;
      await client.query(
        'UPDATE vault_devices SET revoked = true, status = $1 WHERE id = $2',
        ['revoked', fixture.deviceRowId],
      );
      await client.query('COMMIT');
      await expectedFailure;
      expect(
        await repository.findPending(
          fixture.scope,
          registration.snapshot.challenge,
        ),
      ).toBeDefined();
      const keysets = await database
        .select()
        .from(vaultKeysets)
        .where(eq(vaultKeysets.id, fixture.keysetId));
      expect(keysets[0]?.recoveryPublicKey).toBeNull();
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('should allow only one concurrent registration of a challenge', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const repository = new PostgresRecoveryRegistrationRepository(database);
    const registration = await repository.prepare({
      ...fixture.scope,
      recoveryPublicKey: fixture.signature.recoveryPublicKey,
    });
    const outcomes = await Promise.allSettled([
      repository.register(registration, registration.snapshot.expiresAt),
      repository.register(registration, registration.snapshot.expiresAt),
    ]);
    expect(
      outcomes.filter((outcome) => outcome.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      outcomes.filter((outcome) => outcome.status === 'rejected'),
    ).toHaveLength(1);
    const rows = await database
      .select()
      .from(vaultRecoveryAuthorityChallenges)
      .where(
        and(
          eq(vaultRecoveryAuthorityChallenges.vaultId, fixture.scope.vaultId),
          eq(
            vaultRecoveryAuthorityChallenges.challenge,
            registration.snapshot.challenge,
          ),
        ),
      );
    expect(rows[0]?.consumedAt).toBeInstanceOf(Date);
  });

  it('should roll back registration when the database auth deadline has passed even if the application clock lags', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const repository = new PostgresRecoveryRegistrationRepository(database);
    const laggingClock = Date.now() - recoveryRegistrationFormat.ttlMs / 2;
    const clock = jest.spyOn(Date, 'now').mockReturnValue(laggingClock);
    try {
      const registration = await repository.prepare({
        ...fixture.scope,
        recoveryPublicKey: fixture.signature.recoveryPublicKey,
      });
      const expiredDatabaseDeadline =
        laggingClock + recoveryRegistrationFormat.ttlMs / 4;
      await expect(
        repository.register(registration, expiredDatabaseDeadline),
      ).rejects.toThrow(DomainError);
      expect(
        await repository.findPending(
          fixture.scope,
          registration.snapshot.challenge,
        ),
      ).toBeDefined();
      const keysets = await database
        .select()
        .from(vaultKeysets)
        .where(eq(vaultKeysets.id, fixture.keysetId));
      expect(keysets[0]?.recoveryPublicKey).toBeNull();
    } finally {
      clock.mockRestore();
    }
  });
});
