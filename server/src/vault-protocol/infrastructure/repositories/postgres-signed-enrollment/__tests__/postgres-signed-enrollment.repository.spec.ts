import { DomainError } from '@budget/domain';
import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { Pool } from 'pg';
import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import {
  vaults,
  vaultDevices,
  vaultKeysets,
  signedEnrollmentChallenges,
} from '@shared/infrastructure/database/schema';
import { mapRowToSignedEnrollment } from '@vault-protocol/infrastructure/mappers/map-signed-enrollment';
import type { SignedEnrollmentInput } from '@vault-protocol/domain/entities/signed-enrollment';
import { PostgresSignedEnrollmentRepository } from '@vault-protocol/infrastructure/repositories/postgres-signed-enrollment';
import { EnrollmentProofVerifierAdapter } from '@vault-protocol/infrastructure/adapters/enrollment-proof-verifier';
import { VaultSignatureVerifierAdapter } from '@vault-protocol/infrastructure/adapters/vault-signature-verifier';
import { createVaultSecurityTestConnection } from '@vault-protocol/testing/vault-security-test-connection';
import { buildPostgresRecoveryFixture } from '@vault-protocol/testing/build-postgres-recovery-fixture';
import { buildVaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture';
import { signSignedEnrollment } from '@vault-protocol/testing/sign-signed-enrollment';
import { signEnrollmentConfirmation } from '@vault-protocol/testing/sign-enrollment-confirmation';

describe('PostgreSQL complete signed enrollment', () => {
  let pool: Pool;
  let database: DrizzleDatabase;
  let repository: PostgresSignedEnrollmentRepository;
  const previousInfrastructureKey =
    process.env['VAULT_INFRASTRUCTURE_KEY_BASE64'];
  beforeAll(async () => {
    process.env['VAULT_INFRASTRUCTURE_KEY_BASE64'] = Buffer.alloc(
      32,
      37,
    ).toString('base64');
    const connection = await createVaultSecurityTestConnection();
    pool = connection.pool;
    database = connection.database;
    repository = new PostgresSignedEnrollmentRepository(
      database,
      new EnrollmentProofVerifierAdapter(new VaultSignatureVerifierAdapter()),
      new VaultSignatureVerifierAdapter(),
    );
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
  afterAll(async () => {
    await pool.end();
    if (previousInfrastructureKey === undefined)
      delete process.env['VAULT_INFRASTRUCTURE_KEY_BASE64'];
    else
      process.env['VAULT_INFRASTRUCTURE_KEY_BASE64'] =
        previousInfrastructureKey;
  });

  it('should allow a fully authorized retry only after the old pending confirmation expires, never overwrite an active device', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const firstDevice = buildVaultSignatureFixture();
    const nextDevice = buildVaultSignatureFixture();
    try {
      await database
        .update(vaultKeysets)
        .set({ recoveryPublicKey: firstDevice.recoveryPublicKey })
        .where(eq(vaultKeysets.id, fixture.keysetId));
      const input: SignedEnrollmentInput = {
        accountId: fixture.scope.userId,
        workspaceId: fixture.scope.workspaceId,
        vaultId: fixture.scope.vaultId,
        keyId: fixture.scope.keyId,
        deviceId: 'pending-retry-device',
        purpose: 'recovery',
        signingPublicKey: firstDevice.devicePublicKey,
        recoveryPublicKey: firstDevice.recoveryPublicKey,
      };
      const first = await repository.prepare(input, Date.now() + 300_000);
      const firstRequest = signSignedEnrollment(
        first,
        firstDevice,
        fixture.signature,
      );
      await repository.finalize(firstRequest);
      const next = await repository.prepare(
        { ...input, signingPublicKey: nextDevice.devicePublicKey },
        Date.now() + 300_000,
      );
      const nextSigner = {
        ...nextDevice,
        recoverySeed: firstDevice.recoverySeed,
        recoveryPublicKey: firstDevice.recoveryPublicKey,
      };
      const nextRequest = signSignedEnrollment(
        next,
        nextSigner,
        fixture.signature,
      );
      await expect(repository.finalize(nextRequest)).rejects.toThrow(
        DomainError,
      );
      const createdAt = Date.now() - 120_000;
      const expired = first.consume(
        createHash('sha256')
          .update(
            first.finalizeTranscript(firstRequest).toFinalizeSigningBytes(),
          )
          .digest('hex'),
      );
      await database
        .update(signedEnrollmentChallenges)
        .set({
          createdAt: new Date(createdAt),
          expiresAt: new Date(createdAt + 60_000),
          consumedAt: new Date(createdAt + 1),
          intent: JSON.stringify({
            ...expired.snapshot,
            intent: {
              ...expired.snapshot.intent,
              createdAt,
              expiresAt: createdAt + 60_000,
            },
          }),
        })
        .where(
          eq(signedEnrollmentChallenges.challenge, firstRequest.challenge),
        );
      await repository.finalize(nextRequest);
      await expect(
        repository.confirm(
          signEnrollmentConfirmation(first, firstRequest, firstDevice),
        ),
      ).rejects.toThrow(DomainError);
      await repository.confirm(
        signEnrollmentConfirmation(next, nextRequest, nextSigner),
      );
      const active = await database
        .select()
        .from(vaultDevices)
        .where(
          and(
            eq(vaultDevices.userId, fixture.scope.userId),
            eq(vaultDevices.deviceId, 'pending-retry-device'),
          ),
        );
      expect(active).toHaveLength(1);
      expect(active[0]).toMatchObject({
        status: 'active',
        signingPublicKey: nextDevice.devicePublicKey,
      });
      const attempt = await repository.prepare(input, Date.now() + 300_000);
      await expect(
        repository.finalize(
          signSignedEnrollment(attempt, firstDevice, fixture.signature),
        ),
      ).rejects.toThrow(DomainError);
      const preserved = await database
        .select()
        .from(vaultDevices)
        .where(
          and(
            eq(vaultDevices.userId, fixture.scope.userId),
            eq(vaultDevices.deviceId, 'pending-retry-device'),
          ),
        );
      expect(preserved[0]).toMatchObject({
        id: active[0]?.id,
        status: 'active',
        signingPublicKey: nextDevice.devicePublicKey,
      });
    } finally {
      firstDevice.recoverySeed.fill(0);
      nextDevice.recoverySeed.fill(0);
      fixture.signature.recoverySeed.fill(0);
    }
  });

  it('should recheck approver revocation after real proof verification and roll back every enrollment write', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const device = buildVaultSignatureFixture();
    const signatures = new VaultSignatureVerifierAdapter();
    const proofs = new EnrollmentProofVerifierAdapter(signatures);
    const verify = proofs.verify.bind(proofs);
    const concurrent = new PostgresSignedEnrollmentRepository(
      database,
      proofs,
      signatures,
    );
    try {
      const enrollment = await concurrent.prepare(
        {
          accountId: fixture.scope.userId,
          workspaceId: fixture.scope.workspaceId,
          vaultId: fixture.scope.vaultId,
          keyId: fixture.scope.keyId,
          deviceId: 'revocation-race-device',
          purpose: 'trusted',
          signingPublicKey: device.devicePublicKey,
          oldDeviceId: fixture.scope.deviceId,
          newEphemeralPublicKey: device.devicePublicKey,
        },
        Date.now() + 300_000,
      );
      jest
        .spyOn(proofs, 'verify')
        .mockImplementation(async (transcript, proof) => {
          const valid = await verify(transcript, proof);
          expect(valid).toBe(true);
          await database
            .update(vaultDevices)
            .set({ revoked: true })
            .where(eq(vaultDevices.id, fixture.deviceRowId));
          return valid;
        });
      const request = signSignedEnrollment(
        enrollment,
        device,
        fixture.signature,
      );
      await expect(concurrent.finalize(request)).rejects.toThrow(DomainError);
      const devices = await database
        .select()
        .from(vaultDevices)
        .where(
          and(
            eq(vaultDevices.userId, fixture.scope.userId),
            eq(vaultDevices.deviceId, 'revocation-race-device'),
          ),
        );
      expect(devices).toHaveLength(0);
      const challenges = await database
        .select()
        .from(signedEnrollmentChallenges)
        .where(eq(signedEnrollmentChallenges.challenge, request.challenge));
      expect(challenges[0]?.consumedAt).toBeNull();
    } finally {
      device.recoverySeed.fill(0);
      fixture.signature.recoverySeed.fill(0);
    }
  });

  it('should reject altered confirmation context/digest and revocation during real confirmation verification', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const device = buildVaultSignatureFixture();
    const signatures = new VaultSignatureVerifierAdapter();
    const concurrent = new PostgresSignedEnrollmentRepository(
      database,
      new EnrollmentProofVerifierAdapter(signatures),
      signatures,
    );
    try {
      await database
        .update(vaultKeysets)
        .set({ recoveryPublicKey: device.recoveryPublicKey })
        .where(eq(vaultKeysets.id, fixture.keysetId));
      const enrollment = await concurrent.prepare(
        {
          accountId: fixture.scope.userId,
          workspaceId: fixture.scope.workspaceId,
          vaultId: fixture.scope.vaultId,
          keyId: fixture.scope.keyId,
          deviceId: 'confirmation-race-device',
          purpose: 'recovery',
          signingPublicKey: device.devicePublicKey,
          recoveryPublicKey: device.recoveryPublicKey,
        },
        Date.now() + 300_000,
      );
      const finalized = signSignedEnrollment(
        enrollment,
        device,
        fixture.signature,
      );
      await concurrent.finalize(finalized);
      const request = signEnrollmentConfirmation(enrollment, finalized, device);
      for (const substitution of [
        { digest: '0'.repeat(64) },
        { accountId: '12345678-1234-4234-8234-123456789abc' },
        { workspaceId: '12345678-1234-4234-8234-123456789abc' },
        { keyId: 'other' },
        { deviceId: 'other' },
        { challenge: 'B'.repeat(43) },
      ]) {
        await expect(
          concurrent.confirm({ ...request, ...substitution }),
        ).rejects.toThrow(DomainError);
      }
      const verify = signatures.verifyDevice.bind(signatures);
      jest
        .spyOn(signatures, 'verifyDevice')
        .mockImplementation(async (publicKey, bytes, signature) => {
          const valid = await verify(publicKey, bytes, signature);
          expect(valid).toBe(true);
          await database
            .update(vaultDevices)
            .set({ revoked: true })
            .where(
              and(
                eq(vaultDevices.userId, fixture.scope.userId),
                eq(vaultDevices.deviceId, 'confirmation-race-device'),
              ),
            );
          return valid;
        });
      await expect(concurrent.confirm(request)).rejects.toThrow(DomainError);
      const devices = await database
        .select()
        .from(vaultDevices)
        .where(
          and(
            eq(vaultDevices.userId, fixture.scope.userId),
            eq(vaultDevices.deviceId, 'confirmation-race-device'),
          ),
        );
      expect(devices[0]).toMatchObject({ status: 'pending', revoked: true });
      const challenges = await database
        .select()
        .from(signedEnrollmentChallenges)
        .where(eq(signedEnrollmentChallenges.challenge, request.challenge));
      expect(challenges[0]?.confirmedAt).toBeNull();
    } finally {
      device.recoverySeed.fill(0);
      fixture.signature.recoverySeed.fill(0);
    }
  });

  it.each(['initial', 'recovery', 'trusted'])(
    'should enroll %s with real proofs, then require owned signed confirmation',
    async (purpose) => {
      const fixture = await buildPostgresRecoveryFixture(database);
      const device = buildVaultSignatureFixture();
      try {
        if (purpose === 'initial')
          await database
            .delete(vaults)
            .where(eq(vaults.id, fixture.scope.vaultId));
        if (purpose === 'recovery')
          await database
            .update(vaultKeysets)
            .set({ recoveryPublicKey: device.recoveryPublicKey })
            .where(eq(vaultKeysets.id, fixture.keysetId));
        const common = {
          accountId: fixture.scope.userId,
          workspaceId: fixture.scope.workspaceId,
          vaultId: fixture.scope.vaultId,
          keyId: fixture.scope.keyId,
          deviceId: 'new-device',
          signingPublicKey: device.devicePublicKey,
        };
        const input: SignedEnrollmentInput =
          purpose === 'trusted'
            ? {
                ...common,
                purpose: 'trusted',
                oldDeviceId: fixture.scope.deviceId,
                newEphemeralPublicKey: device.devicePublicKey,
              }
            : {
                ...common,
                purpose: purpose === 'initial' ? 'initial' : 'recovery',
                recoveryPublicKey: device.recoveryPublicKey,
              };
        const enrollment = await repository.prepare(
          input,
          Date.now() + 300_000,
        );
        const share = enrollment.copyPreparedShare();
        expect(share).toHaveLength(32);
        share.fill(0);
        const finalized = signSignedEnrollment(
          enrollment,
          device,
          fixture.signature,
        );
        await repository.finalize(finalized);
        await expect(repository.finalize(finalized)).rejects.toThrow(
          DomainError,
        );
        const confirmation = signEnrollmentConfirmation(
          enrollment,
          finalized,
          device,
        );
        await expect(
          repository.confirm({ ...confirmation, signature: '0'.repeat(128) }),
        ).rejects.toThrow(DomainError);
        await repository.confirm(confirmation);
        await expect(repository.confirm(confirmation)).rejects.toThrow(
          DomainError,
        );
        const devices = await database
          .select()
          .from(vaultDevices)
          .where(
            and(
              eq(vaultDevices.userId, fixture.scope.userId),
              eq(vaultDevices.deviceId, common.deviceId),
            ),
          );
        expect(
          devices.find((row) => row.userId === common.accountId),
        ).toMatchObject({
          status: 'active',
          signingPublicKey: device.devicePublicKey,
        });
        const financial = await database
          .select()
          .from(vaults)
          .where(eq(vaults.id, fixture.scope.vaultId));
        expect(financial[0]?.revision).toBe(purpose === 'initial' ? 0 : 7);
        if (purpose !== 'initial')
          expect(financial[0]?.encryptedBlob).toBe('opaque-financial-fixture');
        const stored = await database
          .select()
          .from(signedEnrollmentChallenges)
          .where(eq(signedEnrollmentChallenges.challenge, finalized.challenge));
        const storedRow = stored[0];
        if (storedRow === undefined)
          throw new Error('Stored test enrollment missing');
        expect(mapRowToSignedEnrollment(storedRow).snapshot.state.kind).toBe(
          'active',
        );
      } finally {
        device.recoverySeed.fill(0);
        fixture.signature.recoverySeed.fill(0);
      }
    },
  );

  it('should reject substituted envelopes and account/key context without consuming the valid challenge', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const device = buildVaultSignatureFixture();
    try {
      const enrollment = await repository.prepare(
        {
          accountId: fixture.scope.userId,
          workspaceId: fixture.scope.workspaceId,
          vaultId: fixture.scope.vaultId,
          keyId: fixture.scope.keyId,
          deviceId: 'context-device',
          purpose: 'trusted',
          signingPublicKey: device.devicePublicKey,
          oldDeviceId: fixture.scope.deviceId,
          newEphemeralPublicKey: device.devicePublicKey,
        },
        Date.now() + 300_000,
      );
      const request = signSignedEnrollment(
        enrollment,
        device,
        fixture.signature,
      );
      await expect(
        repository.finalize({ ...request, deviceEnvelope: '{"changed":true}' }),
      ).rejects.toThrow(DomainError);
      await expect(
        repository.finalize({
          ...request,
          passkeyEnvelope: '{"injected":true}',
        }),
      ).rejects.toThrow(DomainError);
      await expect(
        repository.finalize({ ...request, keyId: 'wrong-key' }),
      ).rejects.toThrow(DomainError);
      await expect(
        repository.finalize({
          ...request,
          accountId: '00000000-0000-4000-8000-000000000099',
        }),
      ).rejects.toThrow(DomainError);
      const rows = await database
        .select()
        .from(signedEnrollmentChallenges)
        .where(eq(signedEnrollmentChallenges.challenge, request.challenge));
      expect(rows[0]?.consumedAt).toBeNull();
      await repository.finalize(request);
    } finally {
      device.recoverySeed.fill(0);
      fixture.signature.recoverySeed.fill(0);
    }
  });

  it('should reject stale recovery authority, revoked approver and expired interactive authorization', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const device = buildVaultSignatureFixture();
    try {
      const common = {
        accountId: fixture.scope.userId,
        workspaceId: fixture.scope.workspaceId,
        vaultId: fixture.scope.vaultId,
        keyId: fixture.scope.keyId,
        deviceId: 'revocation-device',
        signingPublicKey: device.devicePublicKey,
      };
      await expect(
        repository.prepare(
          {
            ...common,
            purpose: 'recovery',
            recoveryPublicKey: device.recoveryPublicKey,
          },
          Date.now() + 300_000,
        ),
      ).rejects.toThrow(DomainError);
      const enrollment = await repository.prepare(
        {
          ...common,
          purpose: 'trusted',
          oldDeviceId: fixture.scope.deviceId,
          newEphemeralPublicKey: device.devicePublicKey,
        },
        Date.now() + 300_000,
      );
      const request = signSignedEnrollment(
        enrollment,
        device,
        fixture.signature,
      );
      await expect(
        repository.finalize({ ...request, authDeadline: Date.now() - 1 }),
      ).rejects.toThrow(DomainError);
      await database
        .update(vaultDevices)
        .set({ revoked: true, status: 'revoked' })
        .where(eq(vaultDevices.id, fixture.deviceRowId));
      await expect(repository.finalize(request)).rejects.toThrow(DomainError);
    } finally {
      device.recoverySeed.fill(0);
      fixture.signature.recoverySeed.fill(0);
    }
  });

  it('should allow only one concurrent finalize and roll back duplicate enrollment writes', async () => {
    const fixture = await buildPostgresRecoveryFixture(database);
    const device = buildVaultSignatureFixture();
    try {
      const enrollment = await repository.prepare(
        {
          accountId: fixture.scope.userId,
          workspaceId: fixture.scope.workspaceId,
          vaultId: fixture.scope.vaultId,
          keyId: fixture.scope.keyId,
          deviceId: 'concurrent-device',
          purpose: 'trusted',
          signingPublicKey: device.devicePublicKey,
          oldDeviceId: fixture.scope.deviceId,
          newEphemeralPublicKey: device.devicePublicKey,
        },
        Date.now() + 300_000,
      );
      const request = signSignedEnrollment(
        enrollment,
        device,
        fixture.signature,
      );
      const results = await Promise.allSettled([
        repository.finalize(request),
        repository.finalize(request),
      ]);
      expect(
        results.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      const digest = createHash('sha256')
        .update(enrollment.finalizeTranscript(request).toFinalizeSigningBytes())
        .digest('hex');
      expect(
        signEnrollmentConfirmation(enrollment, request, device).digest,
      ).toBe(digest);
    } finally {
      device.recoverySeed.fill(0);
      fixture.signature.recoverySeed.fill(0);
    }
  });
});
