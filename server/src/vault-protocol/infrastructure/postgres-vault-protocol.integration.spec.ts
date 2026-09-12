import { randomUUID, webcrypto } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import * as schema from '@shared/infrastructure/database/schema';
import { PostgresServerShareRepository } from './postgres-server-share.repository';
import { ServerShareEncryptionAdapter } from './server-share-encryption.adapter';
import { PostgresVaultDeviceRepository } from './postgres-vault-device.repository';
import { PostgresVaultRotationRepository } from './postgres-vault-rotation.repository';
import { PostgresVaultSecurityRepository } from './postgres-vault-security.repository';
import { PostgresVaultBootstrapRepository } from './postgres-vault-bootstrap.repository';
import { PostgresVaultEnrollmentRepository } from './postgres-vault-enrollment.repository';
import { PostgresAccountDeletionRepository } from '@user-settings/infrastructure/postgres-account-deletion.repository';
import { PostgresSyncSnapshotRepository } from './postgres-sync-snapshot.repository';
import { PostgresWebauthnChallengeStore } from './postgres-webauthn-challenge.store';
import { PostgresWebauthnCredentialRepository } from './postgres-webauthn-credential.repository';

const runIntegration = process.env.RUN_POSTGRES_INTEGRATION === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

const {
  users,
  workspaces,
  vaults,
  vaultKeysets,
  vaultDevices,
  vaultServerShares,
  vaultDeviceEnvelopes,
  vaultSyncSnapshots,
  vaultEnrollmentChallenges,
  vaultRotations,
  webauthnCredentials,
  webauthnChallenges,
} = schema;

describeIntegration('Vault Protocol v2 PostgreSQL integration', () => {
  let pool: Pool;
  let database: DrizzleDatabase;
  let userId: string;
  let workspaceId: string;
  let vaultId: string;
  let keysetId: string;
  let deviceRowId: string;
  let serverShare: Uint8Array;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      database: process.env.DB_NAME ?? 'budget',
      user: process.env.DB_USER ?? 'budget_app',
      password: process.env.DB_PASSWORD ?? '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
    });
    database = drizzle(pool, { schema });

    userId = randomUUID();
    workspaceId = randomUUID();
    vaultId = randomUUID();
    keysetId = randomUUID();
    deviceRowId = randomUUID();
    serverShare = new Uint8Array(32).fill(0x5a);
    const now = new Date();

    await database.insert(workspaces).values({
      id: workspaceId,
      name: 'Vault v2 integration workspace',
      createdAt: now,
    });
    await database.insert(users).values({
      id: userId,
      email: `${userId}@vault-v2.test`,
      passwordHash: 'integration-only-hash',
      role: 'Member',
      workspaceId,
      createdAt: now,
      preferences: {},
      tokenVersion: 0,
    });
    await database.insert(vaults).values({
      id: vaultId,
      workspaceId,
      encryptedBlob: '',
      contentHash: '',
      byteSize: 0,
      revision: 0,
      createdAt: now,
      updatedAt: now,
    });
    await database.insert(vaultKeysets).values({
      id: keysetId,
      vaultId,
      keyId: 'key-v2-integration',
      protocolVersion: '2',
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      createdAt: now,
      updatedAt: now,
    });
    await database.insert(vaultDevices).values({
      id: deviceRowId,
      userId,
      keysetId,
      deviceId: 'device-v2-integration',
      signingPublicKey: JSON.stringify({ kty: 'EC', crv: 'P-256' }),
      status: 'active',
      revoked: false,
      createdAt: now,
      lastSeenAt: now,
    });

    const encrypted = new ServerShareEncryptionAdapter().encrypt(serverShare);
    await database.insert(vaultServerShares).values({
      id: randomUUID(),
      deviceId: deviceRowId,
      ...encrypted,
      createdAt: now,
      updatedAt: now,
    });
    await database.insert(vaultDeviceEnvelopes).values({
      id: randomUUID(),
      deviceId: deviceRowId,
      keysetId,
      purpose: 'device-wrap',
      envelope: 'opaque-vmk-envelope',
      protocolVersion: '2',
      createdAt: now,
      updatedAt: now,
    });
    await database.insert(vaultDeviceEnvelopes).values({
      id: randomUUID(),
      deviceId: deviceRowId,
      keysetId,
      purpose: 'passkey-wrap',
      envelope: 'opaque-passkey-rotated-envelope',
      protocolVersion: '2',
      createdAt: now,
      updatedAt: now,
    });
    await database.insert(vaultSyncSnapshots).values({
      id: randomUUID(),
      vaultId,
      deviceId: deviceRowId,
      keyId: 'key-v2-integration',
      revision: 1,
      envelopeHash: 'a'.repeat(64),
      previousEnvelopeHash: '0'.repeat(64),
      header: 'opaque-header',
      ciphertext: 'opaque-ciphertext',
      signature: 'opaque-signature',
      createdAt: now,
    });
    await database.insert(webauthnCredentials).values({
      id: randomUUID(),
      userId,
      credentialId: `credential-${userId}`,
      publicKey: 'opaque-public-key',
      counter: '0',
      transports: 'internal',
      supportsPrf: 1,
      createdAt: now,
    });
    await database.insert(webauthnChallenges).values({
      id: randomUUID(),
      userId,
      vaultId,
      deviceId: 'device-v2-integration',
      challenge: `challenge-${userId}`,
      type: 'login',
      expiresAt: new Date(now.getTime() + 60_000),
      createdAt: now,
    });
    await database.insert(vaultEnrollmentChallenges).values({
      id: randomUUID(),
      userId,
      workspaceId,
      deviceId: 'device-v2-integration',
      vaultId,
      challenge: `enrollment-${userId}`,
      ciphertext: 'infrastructure-ciphertext',
      nonce: 'infrastructure-nonce',
      authTag: 'infrastructure-tag',
      infrastructureKeyVersion: 1,
      expiresAt: new Date(now.getTime() + 60_000),
      createdAt: now,
    });
  });

  afterAll(async () => {
    await database.delete(vaults).where(eq(vaults.id, vaultId));
    await database.delete(users).where(eq(users.id, userId));
    await database.delete(workspaces).where(eq(workspaces.id, workspaceId));
    await pool.end();
  });

  it('roundtrips only infrastructure-encrypted ServerShare and enforces device scope', async () => {
    const raw = await database
      .select({
        ciphertext: vaultServerShares.ciphertext,
        nonce: vaultServerShares.nonce,
        authTag: vaultServerShares.authTag,
        infrastructureKeyVersion: vaultServerShares.infrastructureKeyVersion,
      })
      .from(vaultServerShares)
      .where(eq(vaultServerShares.deviceId, deviceRowId));

    expect(raw).toHaveLength(1);
    expect(raw[0]?.ciphertext).not.toBe(
      Buffer.from(serverShare).toString('base64'),
    );
    await expect(
      new PostgresServerShareRepository(database).issue(
        userId,
        workspaceId,
        'device-v2-integration',
      ),
    ).resolves.toEqual(serverShare);
    await expect(
      new PostgresServerShareRepository(database).issue(
        userId,
        randomUUID(),
        'device-v2-integration',
      ),
    ).resolves.toBeUndefined();
  });

  it('maps PostgreSQL WebAuthn credentials and enforces active/revoked state', async () => {
    const repository = new PostgresWebauthnCredentialRepository(database);
    const credentialId = `credential-repository-${userId}`;
    await repository.create({
      userId,
      credentialId,
      publicKey: new Uint8Array([1, 2, 3]),
      counter: 4,
      transports: ['internal', 'usb'],
      supportsPrf: true,
    });

    await expect(
      repository.findActiveByCredentialId(credentialId),
    ).resolves.toEqual(
      expect.objectContaining({
        userId,
        credentialId,
        publicKey: new Uint8Array([1, 2, 3]),
        counter: 4,
        transports: ['internal', 'usb'],
        supportsPrf: true,
      }),
    );
    await expect(repository.listActiveByUserId(userId)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ credentialId })]),
    );
    await repository.updateCounter(credentialId, 9);
    await expect(
      repository.findActiveByCredentialId(credentialId),
    ).resolves.toEqual(expect.objectContaining({ counter: 9 }));
    await repository.revoke(userId, credentialId);
    await expect(
      repository.findActiveByCredentialId(credentialId),
    ).resolves.toBeUndefined();
  });

  it('creates and consumes one-time PostgreSQL WebAuthn challenges', async () => {
    const repository = new PostgresWebauthnChallengeStore(database);
    const created = await repository.create({
      userId,
      vaultId,
      deviceId: 'device-v2-integration',
      type: 'authentication',
    });
    const consumed = await repository.consume(created.challenge, {
      userId,
      vaultId,
      deviceId: 'device-v2-integration',
      type: 'authentication',
    });

    expect(consumed).toEqual(
      expect.objectContaining({
        challenge: created.challenge,
        userId,
        vaultId,
        deviceId: 'device-v2-integration',
        type: 'authentication',
      }),
    );
    await expect(
      repository.consume(created.challenge, {
        userId,
        vaultId,
        deviceId: 'device-v2-integration',
        type: 'authentication',
      }),
    ).rejects.toThrow('Invalid WebAuthn challenge');
  });

  it('reads the latest opaque snapshot and rejects an unverifiable device write', async () => {
    const repository = new PostgresSyncSnapshotRepository(database);
    await expect(
      repository.findLatest(userId, workspaceId, vaultId),
    ).resolves.toEqual(
      expect.objectContaining({
        vaultId,
        keyId: 'key-v2-integration',
        revision: 1,
        ciphertext: 'opaque-ciphertext',
      }),
    );
    await expect(
      repository.saveIfCurrent(
        userId,
        workspaceId,
        {
          vaultId,
          keyId: 'key-v2-integration',
          deviceId: 'device-v2-integration',
          revision: 2,
          previousEnvelopeHash: 'a'.repeat(64),
          envelopeHash: 'b'.repeat(64),
          header: 'opaque-header',
          ciphertext: 'opaque-ciphertext-2',
          signature: 'opaque-signature-2',
          signingPublicKey:
            '{"kty":"EC","crv":"P-256","x":"public-x","y":"public-y"}',
          createdAt: new Date().toISOString(),
        },
        1,
      ),
    ).resolves.toBe('forbidden');
  });

  it('stores a standard PRF envelope without removing the split envelope', async () => {
    await new PostgresVaultSecurityRepository(database).enablePasskeyUnlock({
      userId,
      workspaceId,
      vaultId,
      keyId: 'key-v2-integration',
      deviceId: 'device-v2-integration',
      passkeyEnvelope: 'opaque-passkey-envelope',
    });

    await expect(
      database
        .select({ purpose: vaultDeviceEnvelopes.purpose })
        .from(vaultDeviceEnvelopes)
        .where(eq(vaultDeviceEnvelopes.deviceId, deviceRowId)),
    ).resolves.toEqual(
      expect.arrayContaining([
        { purpose: 'device-wrap' },
        { purpose: 'passkey-wrap' },
      ]),
    );

    const bootstrap = new PostgresVaultBootstrapRepository(database);
    await expect(
      bootstrap.get(userId, workspaceId, 'device-v2-integration'),
    ).resolves.toEqual(
      expect.objectContaining({
        securityProfile: 'standard',
        deviceEnvelope: 'opaque-vmk-envelope',
        passkeyEnvelope: 'opaque-passkey-envelope',
      }),
    );

    await new PostgresVaultSecurityRepository(database).enableHighSecurity({
      userId,
      workspaceId,
      vaultId,
      keyId: 'key-v2-integration',
      deviceId: 'device-v2-integration',
      passkeyEnvelope: 'opaque-high-security-envelope',
    });
    await expect(
      bootstrap.get(userId, workspaceId, 'device-v2-integration'),
    ).resolves.toEqual(
      expect.objectContaining({
        securityProfile: 'high-security',
        passkeyEnvelope: 'opaque-high-security-envelope',
      }),
    );

    const now = new Date();
    await database
      .update(vaultDevices)
      .set({ status: 'active', lastSeenAt: now })
      .where(eq(vaultDevices.id, deviceRowId));
    await database.insert(vaultDeviceEnvelopes).values({
      id: randomUUID(),
      deviceId: deviceRowId,
      keysetId,
      purpose: 'device-wrap',
      envelope: 'opaque-vmk-envelope',
      protocolVersion: '2',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('restores the split envelope when high-security is disabled and rejects a foreign device', async () => {
    const repository = new PostgresVaultSecurityRepository(database);
    const request = {
      userId,
      workspaceId,
      vaultId,
      keyId: 'key-v2-integration',
      deviceId: 'device-v2-integration',
      passkeyEnvelope: 'opaque-high-security-envelope-2',
    } as const;

    await repository.enableHighSecurity(request);
    await expect(
      database
        .select({ purpose: vaultDeviceEnvelopes.purpose })
        .from(vaultDeviceEnvelopes)
        .where(eq(vaultDeviceEnvelopes.deviceId, deviceRowId)),
    ).resolves.toEqual([{ purpose: 'passkey-wrap' }]);

    await expect(
      repository.disableHighSecurity({
        ...request,
        passkeyEnvelope: 'opaque-device-wrap-after-disable',
      }),
    ).resolves.toBeUndefined();

    await expect(
      database
        .select({
          purpose: vaultDeviceEnvelopes.purpose,
          envelope: vaultDeviceEnvelopes.envelope,
        })
        .from(vaultDeviceEnvelopes)
        .where(eq(vaultDeviceEnvelopes.deviceId, deviceRowId)),
    ).resolves.toEqual([
      {
        purpose: 'passkey-wrap',
        envelope: 'opaque-high-security-envelope-2',
      },
      {
        purpose: 'device-wrap',
        envelope: 'opaque-device-wrap-after-disable',
      },
    ]);

    await expect(
      repository.enableHighSecurity({
        ...request,
        deviceId: 'foreign-device',
      }),
    ).rejects.toThrow('Vault device not found');
  });

  it('accepts trusted-device enrollment only with an active device signature', async () => {
    const targetDeviceId = 'device-trusted-qr-integration';
    const signing = (await webcrypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair;
    const signingPublicKey = await webcrypto.subtle.exportKey(
      'jwk',
      signing.publicKey,
    );
    const oldEphemeral = (await webcrypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits'],
    )) as CryptoKeyPair;
    const oldEphemeralPublicKey = await webcrypto.subtle.exportKey(
      'jwk',
      oldEphemeral.publicKey,
    );
    const unsigned = {
      accountId: userId,
      workspaceId,
      vaultId,
      keyId: 'key-v2-integration',
      oldDeviceId: 'device-v2-integration',
      newDeviceId: targetDeviceId,
      formatVersion: 1,
      kind: 'budgetflow/trusted-device-qr',
      requestId: 'trusted-request-integration',
      oldEphemeralPublicKey,
      signingPublicKey,
      nonce: Buffer.alloc(12, 9).toString('base64'),
      ciphertext: Buffer.alloc(32, 8).toString('base64'),
    };
    const sorted = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(sorted);
      if (typeof value !== 'object' || value === null) return value;
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((key) => [key, sorted((value as Record<string, unknown>)[key])]),
      );
    };
    const payload = new TextEncoder().encode(
      JSON.stringify(
        sorted({
          domain: 'budgetflow/trusted-device-qr/v1',
          ...unsigned,
        }),
      ),
    );
    const signature = await webcrypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      signing.privateKey,
      payload,
    );
    const proof = JSON.stringify({
      ...unsigned,
      signature: Buffer.from(signature).toString('base64'),
    });
    const oldSigningPublicKey = JSON.stringify(signingPublicKey);
    await database
      .update(vaultDevices)
      .set({ signingPublicKey: oldSigningPublicKey })
      .where(eq(vaultDevices.id, deviceRowId));

    try {
      const repository = new PostgresVaultEnrollmentRepository(database);
      const prepared = await repository.prepare(
        userId,
        workspaceId,
        targetDeviceId,
        vaultId,
      );
      await repository.finalize({
        challenge: prepared.challenge,
        userId,
        workspaceId,
        deviceId: targetDeviceId,
        vaultId,
        keyId: 'key-v2-integration',
        deviceEnvelope: 'opaque-trusted-device-envelope',
        signingPublicKey: '{"kty":"EC","crv":"P-256","x":"x","y":"y"}',
        trustedDeviceProof: proof,
      });
      await expect(
        database
          .select({ status: vaultDevices.status })
          .from(vaultDevices)
          .where(
            and(
              eq(vaultDevices.userId, userId),
              eq(vaultDevices.deviceId, targetDeviceId),
            ),
          ),
      ).resolves.toEqual([{ status: 'pending' }]);
    } finally {
      await database
        .delete(vaultDevices)
        .where(
          and(
            eq(vaultDevices.userId, userId),
            eq(vaultDevices.deviceId, targetDeviceId),
          ),
        );
      await database
        .update(vaultDevices)
        .set({ signingPublicKey: JSON.stringify({ kty: 'EC', crv: 'P-256' }) })
        .where(eq(vaultDevices.id, deviceRowId));
    }
  });

  it('keeps a recovered device pending until local key confirmation', async () => {
    const targetDeviceId = 'device-pending-integration';
    const repository = new PostgresVaultEnrollmentRepository(database);
    const prepared = await repository.prepare(
      userId,
      workspaceId,
      targetDeviceId,
      vaultId,
    );
    await repository.finalize({
      challenge: prepared.challenge,
      userId,
      workspaceId,
      deviceId: targetDeviceId,
      vaultId,
      keyId: 'key-v2-integration',
      deviceEnvelope: 'opaque-pending-device-envelope',
      signingPublicKey: '{"kty":"EC","crv":"P-256","x":"x","y":"y"}',
    });

    const bootstrap = new PostgresVaultBootstrapRepository(database);
    await expect(
      bootstrap.get(userId, workspaceId, targetDeviceId),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'enrollment-required',
        vaultId,
        keyId: 'key-v2-integration',
      }),
    );
    await expect(
      new PostgresServerShareRepository(database).issue(
        userId,
        workspaceId,
        targetDeviceId,
      ),
    ).resolves.toBeUndefined();

    await repository.confirm({
      challenge: prepared.challenge,
      userId,
      workspaceId,
      deviceId: targetDeviceId,
      vaultId,
      keyId: 'key-v2-integration',
    });
    await expect(
      bootstrap.get(userId, workspaceId, targetDeviceId),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'available',
        deviceEnvelope: 'opaque-pending-device-envelope',
      }),
    );
    await expect(
      new PostgresServerShareRepository(database).issue(
        userId,
        workspaceId,
        targetDeviceId,
      ),
    ).resolves.toHaveLength(32);

    await database
      .delete(vaultDevices)
      .where(
        and(
          eq(vaultDevices.userId, userId),
          eq(vaultDevices.deviceId, targetDeviceId),
        ),
      );
  });

  it('rejects recovery enrollment without a vault id when the workspace already has a vault', async () => {
    await expect(
      new PostgresVaultEnrollmentRepository(database).prepare(
        userId,
        workspaceId,
        'device-without-vault-id',
      ),
    ).rejects.toThrow('Vault already exists in workspace');
  });

  it('allows only one concurrent first-vault enrollment in an empty workspace', async () => {
    const raceWorkspaceId = randomUUID();
    const raceUserId = randomUUID();
    const firstDeviceId = 'device-race-first';
    const secondDeviceId = 'device-race-second';
    const firstVaultId = randomUUID();
    const secondVaultId = randomUUID();
    const now = new Date();

    await database.insert(workspaces).values({
      id: raceWorkspaceId,
      name: 'Vault v2 enrollment race workspace',
      createdAt: now,
    });
    await database.insert(users).values({
      id: raceUserId,
      email: `${raceUserId}@vault-v2-race.test`,
      passwordHash: 'integration-only-hash',
      role: 'Member',
      workspaceId: raceWorkspaceId,
      createdAt: now,
      preferences: {},
      tokenVersion: 0,
    });

    try {
      const repository = new PostgresVaultEnrollmentRepository(database);
      const [first, second] = await Promise.all([
        repository.prepare(raceUserId, raceWorkspaceId, firstDeviceId),
        repository.prepare(raceUserId, raceWorkspaceId, secondDeviceId),
      ]);
      const finalized = await Promise.allSettled([
        repository.finalize({
          challenge: first.challenge,
          userId: raceUserId,
          workspaceId: raceWorkspaceId,
          deviceId: firstDeviceId,
          vaultId: firstVaultId,
          keyId: 'key-race-first',
          deviceEnvelope: 'opaque-race-first',
          signingPublicKey: '{"kty":"EC","crv":"P-256"}',
        }),
        repository.finalize({
          challenge: second.challenge,
          userId: raceUserId,
          workspaceId: raceWorkspaceId,
          deviceId: secondDeviceId,
          vaultId: secondVaultId,
          keyId: 'key-race-second',
          deviceEnvelope: 'opaque-race-second',
          signingPublicKey: '{"kty":"EC","crv":"P-256"}',
        }),
      ]);

      expect(
        finalized.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(
        finalized.filter((result) => result.status === 'rejected'),
      ).toHaveLength(1);
      await expect(
        database
          .select({ id: vaults.id })
          .from(vaults)
          .where(eq(vaults.workspaceId, raceWorkspaceId)),
      ).resolves.toHaveLength(1);
    } finally {
      await database
        .delete(vaults)
        .where(eq(vaults.workspaceId, raceWorkspaceId));
      await database.delete(users).where(eq(users.id, raceUserId));
      await database
        .delete(workspaces)
        .where(eq(workspaces.id, raceWorkspaceId));
    }
  });

  it('lists devices within the workspace and revokes only the selected device', async () => {
    const repository = new PostgresVaultDeviceRepository(database);
    await expect(repository.list(userId, workspaceId)).resolves.toEqual([
      expect.objectContaining({
        deviceId: 'device-v2-integration',
        vaultId,
        keyId: 'key-v2-integration',
        status: 'active',
      }),
    ]);
    await repository.revoke(userId, workspaceId, 'device-v2-integration');
    await expect(repository.list(userId, workspaceId)).resolves.toEqual([
      expect.objectContaining({
        deviceId: 'device-v2-integration',
        status: 'revoked',
      }),
    ]);
    await expect(
      repository.revoke(userId, randomUUID(), 'device-v2-integration'),
    ).resolves.toBeUndefined();
  });

  it('commits VMK rotation as one server transaction and clears opaque snapshots', async () => {
    const now = new Date();
    await database
      .update(vaultKeysets)
      .set({ keyId: 'key-v2-integration', updatedAt: now })
      .where(eq(vaultKeysets.id, keysetId));
    await database
      .update(vaultDevices)
      .set({
        revoked: false,
        revokedAt: null,
        status: 'active',
        lastSeenAt: now,
      })
      .where(eq(vaultDevices.id, deviceRowId));
    await database
      .delete(vaultDeviceEnvelopes)
      .where(eq(vaultDeviceEnvelopes.deviceId, deviceRowId));
    await database.insert(vaultDeviceEnvelopes).values({
      id: randomUUID(),
      deviceId: deviceRowId,
      keysetId,
      purpose: 'device-wrap',
      envelope: 'opaque-vmk-envelope',
      protocolVersion: '2',
      createdAt: now,
      updatedAt: now,
    });
    await database.insert(vaultSyncSnapshots).values({
      id: randomUUID(),
      vaultId,
      deviceId: deviceRowId,
      keyId: 'key-v2-integration',
      revision: 2,
      envelopeHash: 'b'.repeat(64),
      previousEnvelopeHash: 'a'.repeat(64),
      header: 'opaque-header',
      ciphertext: 'opaque-ciphertext',
      signature: 'opaque-signature',
      createdAt: now,
    });
    await expect(
      new PostgresVaultRotationRepository(database).rotate({
        userId,
        workspaceId,
        vaultId,
        deviceId: 'device-v2-integration',
        currentKeyId: 'key-v2-integration',
        nextKeyId: 'key-v2-rotated',
        envelopePurpose: 'device-wrap',
        envelope: 'opaque-rotated-vmk-envelope',
        passkeyEnvelope: 'opaque-passkey-rotated-envelope',
        protocolVersion: '2',
        cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
        idempotencyKey: 'integration-rotation-1',
      }),
    ).resolves.toEqual({
      status: 'rotated',
      keyId: 'key-v2-rotated',
      revokedDeviceCount: 0,
    });
    await expect(
      new PostgresVaultRotationRepository(database).rotate({
        userId,
        workspaceId,
        vaultId,
        deviceId: 'device-v2-integration',
        currentKeyId: 'key-v2-integration',
        nextKeyId: 'key-v2-rotated',
        envelopePurpose: 'device-wrap',
        envelope: 'opaque-rotated-vmk-envelope',
        passkeyEnvelope: 'opaque-passkey-rotated-envelope',
        protocolVersion: '2',
        cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
        idempotencyKey: 'integration-rotation-1',
      }),
    ).resolves.toEqual({
      status: 'rotated',
      keyId: 'key-v2-rotated',
      revokedDeviceCount: 0,
    });
    await expect(
      database
        .select({ keyId: vaultKeysets.keyId })
        .from(vaultKeysets)
        .where(eq(vaultKeysets.id, keysetId)),
    ).resolves.toEqual([{ keyId: 'key-v2-rotated' }]);
    await expect(
      database
        .select({ id: vaultSyncSnapshots.id })
        .from(vaultSyncSnapshots)
        .where(eq(vaultSyncSnapshots.vaultId, vaultId)),
    ).resolves.toHaveLength(0);
    await expect(
      database
        .select({
          purpose: vaultDeviceEnvelopes.purpose,
          envelope: vaultDeviceEnvelopes.envelope,
        })
        .from(vaultDeviceEnvelopes)
        .where(eq(vaultDeviceEnvelopes.deviceId, deviceRowId)),
    ).resolves.toEqual([
      {
        purpose: 'device-wrap',
        envelope: 'opaque-rotated-vmk-envelope',
      },
      {
        purpose: 'passkey-wrap',
        envelope: 'opaque-passkey-rotated-envelope',
      },
    ]);
    await expect(
      database
        .select({ nextKeyId: vaultRotations.nextKeyId })
        .from(vaultRotations)
        .where(eq(vaultRotations.vaultId, vaultId)),
    ).resolves.toEqual([{ nextKeyId: 'key-v2-rotated' }]);
  });

  it('revocation prevents issuance without deleting the encrypted record', async () => {
    await database
      .update(vaultDevices)
      .set({ revoked: true, revokedAt: new Date(), status: 'revoked' })
      .where(eq(vaultDevices.id, deviceRowId));
    await expect(
      new PostgresServerShareRepository(database).issue(
        userId,
        workspaceId,
        'device-v2-integration',
      ),
    ).resolves.toBeUndefined();
    await expect(
      database
        .select({ id: vaultServerShares.id })
        .from(vaultServerShares)
        .where(eq(vaultServerShares.deviceId, deviceRowId)),
    ).resolves.toHaveLength(1);
    await expect(
      new PostgresSyncSnapshotRepository(database).findLatest(
        userId,
        workspaceId,
        vaultId,
      ),
    ).resolves.toBeUndefined();
  });

  it('cascades the complete v2 graph when the account is deleted', async () => {
    await new PostgresAccountDeletionRepository(database).deleteUserOwnedData(
      userId,
      workspaceId,
    );

    await expect(
      database.select().from(vaults).where(eq(vaults.id, vaultId)),
    ).resolves.toHaveLength(0);
    await expect(
      database.select().from(vaultKeysets).where(eq(vaultKeysets.id, keysetId)),
    ).resolves.toHaveLength(0);
    await expect(
      database
        .select()
        .from(vaultRotations)
        .where(eq(vaultRotations.vaultId, vaultId)),
    ).resolves.toHaveLength(0);

    await expect(
      database
        .select()
        .from(vaultDevices)
        .where(eq(vaultDevices.id, deviceRowId)),
    ).resolves.toHaveLength(0);
    await expect(
      database
        .select()
        .from(vaultServerShares)
        .where(eq(vaultServerShares.deviceId, deviceRowId)),
    ).resolves.toHaveLength(0);
    await expect(
      database
        .select()
        .from(vaultDeviceEnvelopes)
        .where(eq(vaultDeviceEnvelopes.deviceId, deviceRowId)),
    ).resolves.toHaveLength(0);
    await expect(
      database
        .select()
        .from(vaultSyncSnapshots)
        .where(eq(vaultSyncSnapshots.deviceId, deviceRowId)),
    ).resolves.toHaveLength(0);
    await expect(
      database
        .select()
        .from(webauthnCredentials)
        .where(eq(webauthnCredentials.userId, userId)),
    ).resolves.toHaveLength(0);
    await expect(
      database
        .select()
        .from(webauthnChallenges)
        .where(eq(webauthnChallenges.userId, userId)),
    ).resolves.toHaveLength(0);
    await expect(
      database
        .select()
        .from(vaultEnrollmentChallenges)
        .where(
          and(
            eq(vaultEnrollmentChallenges.userId, userId),
            eq(vaultEnrollmentChallenges.workspaceId, workspaceId),
          ),
        ),
    ).resolves.toHaveLength(0);
  });
});
