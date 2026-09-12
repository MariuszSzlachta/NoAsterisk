import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, inArray, isNull, isNotNull } from 'drizzle-orm';
import { randomBytes, randomUUID } from 'node:crypto';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import {
  vaultDeviceEnvelopes,
  vaultDevices,
  vaultEnrollmentChallenges,
  vaultKeysets,
  vaults,
  vaultServerShares,
} from '@shared/infrastructure/database/schema';
import type {
  EnrollmentPreparation,
  VaultEnrollmentConfirmation,
  VaultEnrollmentRepository,
  VaultEnrollmentRequest,
} from '@vault-protocol/domain/ports/vault-enrollment.repository';
import { ServerShareEncryptionAdapter } from '@vault-protocol/infrastructure/server-share-encryption.adapter';
import { trustedDeviceProof } from '@vault-protocol/infrastructure/verify-trusted-device-proof';

const TTL_MS = 60_000;

@Injectable()
export class PostgresVaultEnrollmentRepository implements VaultEnrollmentRepository {
  private readonly encryption = new ServerShareEncryptionAdapter();

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async prepare(
    userId: string,
    workspaceId: string,
    deviceId: string,
    vaultId?: string,
  ): Promise<EnrollmentPreparation> {
    if (vaultId === undefined) {
      const existingVaults = await this.db
        .select({ id: vaults.id })
        .from(vaults)
        .where(eq(vaults.workspaceId, workspaceId));
      if (existingVaults.length > 0)
        throw new Error('Vault already exists in workspace');
    }
    const serverShare = new Uint8Array(randomBytes(32));
    const encrypted = this.encryption.encrypt(serverShare);
    const challenge = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + TTL_MS);
    await this.db.insert(vaultEnrollmentChallenges).values({
      id: randomUUID(),
      userId,
      workspaceId,
      deviceId,
      vaultId,
      challenge,
      ciphertext: encrypted.ciphertext,
      nonce: encrypted.nonce,
      authTag: encrypted.authTag,
      infrastructureKeyVersion: encrypted.infrastructureKeyVersion,
      expiresAt,
      createdAt: new Date(),
    });
    return { challenge, serverShare, expiresAt: expiresAt.toISOString() };
  }

  async finalize(request: VaultEnrollmentRequest): Promise<void> {
    await this.db.transaction(async (transaction) => {
      const rows = await transaction
        .update(vaultEnrollmentChallenges)
        .set({ consumedAt: new Date() })
        .where(
          and(
            eq(vaultEnrollmentChallenges.challenge, request.challenge),
            eq(vaultEnrollmentChallenges.userId, request.userId),
            eq(vaultEnrollmentChallenges.workspaceId, request.workspaceId),
            eq(vaultEnrollmentChallenges.deviceId, request.deviceId),
            gt(vaultEnrollmentChallenges.expiresAt, new Date()),
            isNull(vaultEnrollmentChallenges.consumedAt),
          ),
        )
        .returning();
      const challenge = rows[0];
      if (
        !challenge ||
        (challenge.vaultId !== null && challenge.vaultId !== request.vaultId)
      )
        throw new Error('Invalid enrollment challenge');
      if (request.trustedDeviceProof !== undefined) {
        let proof: unknown;
        try {
          proof = JSON.parse(request.trustedDeviceProof);
        } catch {
          throw new Error('Invalid trusted-device approval');
        }
        if (
          typeof proof !== 'object' ||
          proof === null ||
          Array.isArray(proof) ||
          typeof (proof as { oldDeviceId?: unknown }).oldDeviceId !== 'string'
        )
          throw new Error('Invalid trusted-device approval');
        const oldDeviceId = (proof as { oldDeviceId: string }).oldDeviceId;
        const approverRows = await transaction
          .select({
            signingPublicKey: vaultDevices.signingPublicKey,
          })
          .from(vaultDevices)
          .innerJoin(vaultKeysets, eq(vaultKeysets.id, vaultDevices.keysetId))
          .innerJoin(vaults, eq(vaults.id, vaultKeysets.vaultId))
          .where(
            and(
              eq(vaultDevices.userId, request.userId),
              eq(vaultDevices.deviceId, oldDeviceId),
              eq(vaults.workspaceId, request.workspaceId),
              eq(vaults.id, request.vaultId),
              eq(vaultKeysets.keyId, request.keyId),
              eq(vaultDevices.revoked, false),
              inArray(vaultDevices.status, ['active', 'high-security']),
            ),
          );
        const approver = approverRows[0];
        if (
          oldDeviceId === request.deviceId ||
          approver?.signingPublicKey === null ||
          approver?.signingPublicKey === undefined ||
          !(await trustedDeviceProof.verify({
            proof: request.trustedDeviceProof,
            context: {
              accountId: request.userId,
              workspaceId: request.workspaceId,
              vaultId: request.vaultId,
              keyId: request.keyId,
              oldDeviceId,
              newDeviceId: request.deviceId,
            },
            expectedSigningPublicKey: approver.signingPublicKey,
          }))
        )
          throw new Error('Invalid trusted-device approval');
      }
      const serverShare = this.encryption.decrypt(challenge);
      const existingVault = await transaction
        .select({ id: vaults.id })
        .from(vaults)
        .where(
          and(
            eq(vaults.id, request.vaultId),
            eq(vaults.workspaceId, request.workspaceId),
          ),
        );
      if (existingVault.length === 0) {
        await transaction.insert(vaults).values({
          id: request.vaultId,
          workspaceId: request.workspaceId,
          encryptedBlob: '',
          contentHash: '',
          byteSize: 0,
          revision: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      const keysetRows = await transaction
        .select({ id: vaultKeysets.id, keyId: vaultKeysets.keyId })
        .from(vaultKeysets)
        .where(eq(vaultKeysets.vaultId, request.vaultId));
      let keyset = keysetRows[0];
      if (keyset && keyset.keyId !== request.keyId)
        throw new Error('Vault key context mismatch');
      if (!keyset) {
        const insertedKeysets = await transaction
          .insert(vaultKeysets)
          .values({
            id: randomUUID(),
            vaultId: request.vaultId,
            keyId: request.keyId,
            protocolVersion: '2',
            cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning({ id: vaultKeysets.id, keyId: vaultKeysets.keyId });
        keyset = insertedKeysets[0];
      }
      if (!keyset) throw new Error('Vault keyset is missing');
      const existingDevices = await transaction
        .select({ id: vaultDevices.id, status: vaultDevices.status })
        .from(vaultDevices)
        .innerJoin(vaultKeysets, eq(vaultDevices.keysetId, vaultKeysets.id))
        .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
        .where(
          and(
            eq(vaultDevices.userId, request.userId),
            eq(vaultDevices.deviceId, request.deviceId),
            eq(vaults.workspaceId, request.workspaceId),
          ),
        );
      const existingDevice = existingDevices[0];
      if (existingDevice?.status === 'active')
        throw new Error('Vault device is already enrolled');
      if (existingDevice !== undefined)
        await transaction
          .delete(vaultDevices)
          .where(eq(vaultDevices.id, existingDevice.id));
      const deviceRowId = randomUUID();
      await transaction.insert(vaultDevices).values({
        id: deviceRowId,
        userId: request.userId,
        keysetId: keyset.id,
        deviceId: request.deviceId,
        signingPublicKey: request.signingPublicKey,
        status: 'pending',
        revoked: false,
        createdAt: new Date(),
        lastSeenAt: new Date(),
      });
      const encryptedStored = this.encryption.encrypt(serverShare);
      await transaction.insert(vaultServerShares).values({
        id: randomUUID(),
        deviceId: deviceRowId,
        ciphertext: encryptedStored.ciphertext,
        nonce: encryptedStored.nonce,
        authTag: encryptedStored.authTag,
        infrastructureKeyVersion: encryptedStored.infrastructureKeyVersion,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const now = new Date();
      const envelopes = [
        { purpose: 'device-wrap', envelope: request.deviceEnvelope },
        ...(request.passkeyEnvelope === undefined
          ? []
          : [{ purpose: 'passkey-wrap', envelope: request.passkeyEnvelope }]),
      ];
      await transaction.insert(vaultDeviceEnvelopes).values(
        envelopes.map((item) => ({
          id: randomUUID(),
          deviceId: deviceRowId,
          keysetId: keyset.id,
          purpose: item.purpose,
          envelope: item.envelope,
          protocolVersion: '2',
          createdAt: now,
          updatedAt: now,
        })),
      );
    });
  }

  async confirm(request: VaultEnrollmentConfirmation): Promise<void> {
    await this.db.transaction(async (transaction) => {
      const now = new Date();
      const challengeRows = await transaction
        .update(vaultEnrollmentChallenges)
        .set({ confirmedAt: now })
        .where(
          and(
            eq(vaultEnrollmentChallenges.challenge, request.challenge),
            eq(vaultEnrollmentChallenges.userId, request.userId),
            eq(vaultEnrollmentChallenges.workspaceId, request.workspaceId),
            eq(vaultEnrollmentChallenges.deviceId, request.deviceId),
            gt(vaultEnrollmentChallenges.expiresAt, now),
            isNotNull(vaultEnrollmentChallenges.consumedAt),
            isNull(vaultEnrollmentChallenges.confirmedAt),
          ),
        )
        .returning({ id: vaultEnrollmentChallenges.id });
      if (challengeRows.length === 0)
        throw new Error('Invalid enrollment confirmation');

      const devices = await transaction
        .select({ id: vaultDevices.id })
        .from(vaultDevices)
        .innerJoin(vaultKeysets, eq(vaultDevices.keysetId, vaultKeysets.id))
        .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
        .where(
          and(
            eq(vaultDevices.userId, request.userId),
            eq(vaultDevices.deviceId, request.deviceId),
            eq(vaultKeysets.vaultId, request.vaultId),
            eq(vaultKeysets.keyId, request.keyId),
            eq(vaults.workspaceId, request.workspaceId),
            eq(vaultDevices.status, 'pending'),
            eq(vaultDevices.revoked, false),
          ),
        );
      const device = devices[0];
      if (device === undefined) throw new Error('Pending vault device missing');
      await transaction
        .update(vaultDevices)
        .set({ status: 'active', lastSeenAt: now })
        .where(eq(vaultDevices.id, device.id));
    });
  }
}
