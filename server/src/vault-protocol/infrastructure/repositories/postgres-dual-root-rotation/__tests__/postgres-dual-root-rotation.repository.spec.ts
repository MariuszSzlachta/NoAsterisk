import { PostgresVaultEnrollmentRepository } from '@vault-protocol/infrastructure/postgres-vault-enrollment.repository';
import { buildTrustedEnrollmentProof } from '@vault-protocol/testing/buildTrustedEnrollmentProof';
import { DomainError } from '@budget/domain';
import { eq } from 'drizzle-orm';
import type { Pool } from 'pg';
import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import {
  vaultKeysets,
  vaultRotationChallenges,
  vaultDeviceEnvelopes,
  vaults,
} from '@shared/infrastructure/database/schema';
import { PostgresDualRootRotationRepository } from '@vault-protocol/infrastructure/repositories/postgres-dual-root-rotation';
import { FinalizeDualRootRotationHandler } from '@vault-protocol/application/commands/finalize-dual-root-rotation';
import { VaultSignatureVerifierAdapter } from '@vault-protocol/infrastructure/adapters/vault-signature-verifier';
import { buildPostgresRotationFixture } from '@vault-protocol/testing/buildPostgresRotationFixture';
import { signVaultRotation } from '@vault-protocol/testing/signVaultRotation';
import { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';
import { createVaultSecurityTestConnection } from '@vault-protocol/testing/vault-security-test-connection';
import { PostgresVaultDeviceRepository } from '@vault-protocol/infrastructure/postgres-vault-device.repository';
const describePostgres =
  process.env.VAULT_SECURITY_TEST_DATABASE_NAME === undefined
    ? describe.skip
    : describe;
describePostgres('PostgresDualRootRotationRepository', () => {
  let pool: Pool | undefined;
  let database: DrizzleDatabase;
  beforeAll(async () => {
    const connection = await createVaultSecurityTestConnection();
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
  it('should atomically replace authority and envelopes and preserve encrypted finances', async () => {
    const f = await buildPostgresRotationFixture(database);
    const repository = new PostgresDualRootRotationRepository(database);
    const transcript = await repository.prepare(f.request, Date.now() + 30_000);
    const handler = new FinalizeDualRootRotationHandler(
      repository,
      new VaultSignatureVerifierAdapter(),
    );
    await handler.execute(signVaultRotation(transcript, f.signature));
    const keys = await database
      .select()
      .from(vaultKeysets)
      .where(eq(vaultKeysets.id, f.keysetId));
    expect(keys[0]?.keyId).toBe(f.request.nextKeyId);
    expect(keys[0]?.recoveryPublicKey).toBe(f.request.nextRecoveryPublicKey);
    const envelopes = await database
      .select()
      .from(vaultDeviceEnvelopes)
      .where(eq(vaultDeviceEnvelopes.deviceId, f.deviceRowId));
    expect(envelopes.map((row) => row.envelope).sort()).toEqual(
      [f.request.envelope, f.request.passkeyEnvelope].sort(),
    );
    const rows = await database
      .select()
      .from(vaults)
      .where(eq(vaults.id, f.scope.vaultId));
    expect(rows[0]?.encryptedBlob).toBe('opaque-financial-fixture');
    await handler.execute(signVaultRotation(transcript, f.signature));
  });
  it.each([
    'passkeyEnvelope',
    'expiresAt',
    'currentRecoveryPublicKey',
    'deviceId',
    'workspaceId',
    'accountId',
    'vaultId',
    'currentKeyId',
    'nextKeyId',
    'challenge',
    'nextRecoveryPublicKey',
    'signingPublicKey',
    'envelopePurpose',
    'envelope',
  ])(
    'should reject a re-signed completed retry with a changed %s',
    async (field) => {
      const f = await buildPostgresRotationFixture(database);
      const repository = new PostgresDualRootRotationRepository(database);
      const original = await repository.prepare(f.request, Date.now() + 30_000);
      const handler = new FinalizeDualRootRotationHandler(
        repository,
        new VaultSignatureVerifierAdapter(),
      );
      await handler.execute(signVaultRotation(original, f.signature));
      let replacement: Partial<typeof original.snapshot> = {
        [field]: 'changed-value',
      };
      if (field === 'expiresAt')
        replacement = { expiresAt: original.snapshot.expiresAt + 1 };
      if (field === 'currentRecoveryPublicKey')
        replacement = { currentRecoveryPublicKey: 'a'.repeat(64) };
      if (field === 'workspaceId')
        replacement = { workspaceId: '00000000-0000-4000-8000-000000000099' };
      if (field === 'accountId')
        replacement = { accountId: '00000000-0000-4000-8000-000000000099' };
      if (field === 'vaultId')
        replacement = { vaultId: '00000000-0000-4000-8000-000000000099' };
      if (field === 'challenge') replacement = { challenge: 'Z'.repeat(43) };
      if (field === 'nextRecoveryPublicKey')
        replacement = { nextRecoveryPublicKey: 'c'.repeat(64) };
      if (field === 'envelopePurpose')
        replacement = {
          envelopePurpose: 'passkey-wrap',
          passkeyEnvelope: undefined,
        };
      const changed = new VaultRotationTranscript({
        ...original.snapshot,
        ...replacement,
      });
      // Repository assertion isolates the immutable receipt check; native handler proof is verified in the other cases.
      await expect(
        repository.finalize(
          changed,
          signVaultRotation(changed, f.signature),
          Date.now() + 30_000,
        ),
      ).rejects.toThrow();
    },
  );
  it('should retain completed receipts after prepare cleanup and later authority changes', async () => {
    const f = await buildPostgresRotationFixture(database);
    const repository = new PostgresDualRootRotationRepository(database);
    const first = await repository.prepare(f.request, Date.now() + 30_000);
    const handler = new FinalizeDualRootRotationHandler(
      repository,
      new VaultSignatureVerifierAdapter(),
    );
    await handler.execute(signVaultRotation(first, f.signature));
    // Later authority changes cannot alter the immutable completed receipt.
    const later = await repository.prepare(
      {
        ...f.request,
        currentKeyId: f.request.nextKeyId,
        nextKeyId: 'third-key',
        nextRecoveryPublicKey: 'c'.repeat(64),
      },
      Date.now() + 30_000,
    );
    await handler.execute(signVaultRotation(later, f.nextSignature));
    await handler.execute(signVaultRotation(first, f.signature));
  });
  it('should renew expired preparation with the same opaque next roots', async () => {
    const f = await buildPostgresRotationFixture(database);
    const repository = new PostgresDualRootRotationRepository(database);
    const authDeadline = Date.now() + 30_000;
    const clock = jest.spyOn(Date, 'now').mockReturnValue(Date.now() - 120_000);
    const expired = await repository.prepare(f.request, authDeadline);
    clock.mockRestore();
    await expect(
      repository.finalize(
        expired,
        signVaultRotation(expired, f.signature),
        Date.now() + 30_000,
      ),
    ).rejects.toThrow(DomainError);
    const renewed = await repository.prepare(f.request, Date.now() + 30_000);
    expect(renewed.snapshot.challenge).not.toBe(expired.snapshot.challenge);
    expect(renewed.snapshot.nextKeyId).toBe(expired.snapshot.nextKeyId);
    await new FinalizeDualRootRotationHandler(
      repository,
      new VaultSignatureVerifierAdapter(),
    ).execute(signVaultRotation(renewed, f.signature));
  });
  it('should allow identical concurrent finalize only once and reject a competing rotation', async () => {
    const f = await buildPostgresRotationFixture(database);
    const repository = new PostgresDualRootRotationRepository(database);
    const one = await repository.prepare(f.request, Date.now() + 30_000);
    const two = await repository.prepare(
      { ...f.request, nextKeyId: 'competing-key' },
      Date.now() + 30_000,
    );
    const proof = signVaultRotation(one, f.signature);
    await Promise.all([
      repository.finalize(one, proof, Date.now() + 30_000),
      repository.finalize(one, proof, Date.now() + 30_000),
    ]);
    await expect(
      repository.finalize(
        two,
        signVaultRotation(two, f.signature),
        Date.now() + 30_000,
      ),
    ).rejects.toThrow(DomainError);
  });
  it('should roll back when the database deadline is expired despite a lagging application clock', async () => {
    const f = await buildPostgresRotationFixture(database);
    const repository = new PostgresDualRootRotationRepository(database);
    const transcript = await repository.prepare(f.request, Date.now() + 30_000);
    const deadline = Date.now() - 10;
    const clock = jest.spyOn(Date, 'now').mockReturnValue(deadline - 1000);
    try {
      await expect(
        repository.finalize(
          transcript,
          signVaultRotation(transcript, f.signature),
          deadline,
        ),
      ).rejects.toThrow(DomainError);
    } finally {
      clock.mockRestore();
    }
    const keys = await database
      .select()
      .from(vaultKeysets)
      .where(eq(vaultKeysets.id, f.keysetId));
    expect(keys[0]?.keyId).toBe(f.scope.keyId);
    const pending = await database
      .select()
      .from(vaultRotationChallenges)
      .where(
        eq(vaultRotationChallenges.challenge, transcript.snapshot.challenge),
      );
    expect(pending[0]?.consumedAt).toBeNull();
  });
  it('should reject revocation committed while finalize waits on the vault lock', async () => {
    const f = await buildPostgresRotationFixture(database);
    const repository = new PostgresDualRootRotationRepository(database);
    const transcript = await repository.prepare(f.request, Date.now() + 30_000);
    if (pool === undefined) throw new Error('Missing isolated pool');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [f.scope.vaultId],
      );
      const operation = repository.finalize(
        transcript,
        signVaultRotation(transcript, f.signature),
        Date.now() + 30_000,
      );
      const failure = expect(operation).rejects.toThrow(DomainError);
      await client.query(
        'UPDATE vault_devices SET revoked = true, status = $1 WHERE id = $2',
        ['revoked', f.deviceRowId],
      );
      await client.query('COMMIT');
      await failure;
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
  it('should reject preparation from another workspace or a revoked initiator', async () => {
    const f = await buildPostgresRotationFixture(database);
    const repository = new PostgresDualRootRotationRepository(database);
    await expect(
      repository.prepare(
        { ...f.request, workspaceId: '00000000-0000-4000-8000-000000000099' },
        Date.now() + 30_000,
      ),
    ).rejects.toThrow(DomainError);
    await new PostgresVaultDeviceRepository(database).revoke(
      f.scope.userId,
      f.scope.workspaceId,
      f.scope.deviceId,
    );
    await expect(
      repository.prepare(f.request, Date.now() + 30_000),
    ).rejects.toThrow(DomainError);
  });
  it('should reject fresh authentication that expires while waiting on the vault lock', async () => {
    const f = await buildPostgresRotationFixture(database);
    const repository = new PostgresDualRootRotationRepository(database);
    const transcript = await repository.prepare(f.request, Date.now() + 30_000);
    const proof = signVaultRotation(transcript, f.signature);
    if (pool === undefined) throw new Error('Missing isolated pool');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
        [f.scope.vaultId],
      );
      const operation = repository.finalize(
        transcript,
        proof,
        Date.now() + 100,
      );
      const failure = expect(operation).rejects.toThrow(DomainError);
      await client.query('SELECT pg_sleep(0.2)');
      await client.query('COMMIT');
      await failure;
      const rows = await database
        .select()
        .from(vaultRotationChallenges)
        .where(
          eq(vaultRotationChallenges.challenge, transcript.snapshot.challenge),
        );
      expect(rows[0]?.consumedAt).toBeNull();
      const keys = await database
        .select()
        .from(vaultKeysets)
        .where(eq(vaultKeysets.id, f.keysetId));
      expect(keys[0]?.keyId).toBe(f.scope.keyId);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
  it('should roll back challenge consumption and authority when a write fails', async () => {
    const f = await buildPostgresRotationFixture(database);
    const repository = new PostgresDualRootRotationRepository(database);
    const transcript = await repository.prepare(
      { ...f.request, nextKeyId: 'forced-write-failure' },
      Date.now() + 30_000,
    );
    if (pool === undefined) throw new Error('Missing isolated pool');
    await pool.query(
      "CREATE FUNCTION vault_review_fail_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.key_id = 'forced-write-failure' THEN RAISE EXCEPTION 'synthetic write failure'; END IF; RETURN NEW; END $$",
    );
    try {
      await pool.query(
        'CREATE TRIGGER vault_review_fail_write BEFORE UPDATE ON vault_keysets FOR EACH ROW EXECUTE FUNCTION vault_review_fail_write()',
      );
      await expect(
        repository.finalize(
          transcript,
          signVaultRotation(transcript, f.signature),
          Date.now() + 30_000,
        ),
      ).rejects.toThrow();
      const rows = await database
        .select()
        .from(vaultRotationChallenges)
        .where(
          eq(vaultRotationChallenges.challenge, transcript.snapshot.challenge),
        );
      expect(rows[0]?.consumedAt).toBeNull();
      const keys = await database
        .select()
        .from(vaultKeysets)
        .where(eq(vaultKeysets.id, f.keysetId));
      expect(keys[0]?.keyId).toBe(f.scope.keyId);
      expect(keys[0]?.recoveryPublicKey).toBe(f.signature.recoveryPublicKey);
    } finally {
      await pool.query(
        'DROP TRIGGER IF EXISTS vault_review_fail_write ON vault_keysets',
      );
      await pool.query('DROP FUNCTION vault_review_fail_write()');
    }
  });

  it.each([false, true])(
    'should reject stale enrollment across rotation, enrollment committed=%s',
    async (committed) => {
      const f = await buildPostgresRotationFixture(database);
      const enrollment = new PostgresVaultEnrollmentRepository(database);
      const targetDeviceId = 'synthetic-enrollment-race';
      const prepared = await enrollment.prepare(
        f.scope.userId,
        f.scope.workspaceId,
        targetDeviceId,
        f.scope.vaultId,
      );
      const request = {
        challenge: prepared.challenge,
        userId: f.scope.userId,
        workspaceId: f.scope.workspaceId,
        deviceId: targetDeviceId,
        vaultId: f.scope.vaultId,
        keyId: f.scope.keyId,
        deviceEnvelope: 'opaque-enrollment-envelope',
        signingPublicKey: f.signature.devicePublicKey,
        trustedDeviceProof: buildTrustedEnrollmentProof(
          {
            accountId: f.scope.userId,
            workspaceId: f.scope.workspaceId,
            vaultId: f.scope.vaultId,
            keyId: f.scope.keyId,
            oldDeviceId: f.scope.deviceId,
            newDeviceId: targetDeviceId,
          },
          f.signature,
        ),
      };
      if (committed) await enrollment.finalize(request);
      const repository = new PostgresDualRootRotationRepository(database);
      const transcript = await repository.prepare(
        f.request,
        Date.now() + 30_000,
      );
      await new FinalizeDualRootRotationHandler(
        repository,
        new VaultSignatureVerifierAdapter(),
      ).execute(signVaultRotation(transcript, f.signature));
      if (committed)
        await expect(enrollment.confirm(request)).rejects.toThrow();
      else
        await expect(enrollment.finalize(request)).rejects.toThrow(
          'Invalid trusted-device approval',
        );
    },
  );
});
