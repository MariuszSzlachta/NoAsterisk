import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import {
  vaultDeviceEnvelopes,
  vaultDevices,
  vaultKeysets,
  vaultRotations,
  vaultServerShares,
  vaultSyncSnapshots,
  vaults,
} from '@shared/infrastructure/database/schema';
import type {
  RotateVaultRequest,
  RotateVaultResult,
  VaultRotationRepository,
} from '@vault-protocol/domain/ports/vault-rotation.repository';

@Injectable()
export class PostgresVaultRotationRepository implements VaultRotationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async rotate(request: RotateVaultRequest): Promise<RotateVaultResult> {
    return this.db.transaction(async (transaction) => {
      const existing = await transaction
        .select({
          keyId: vaultRotations.nextKeyId,
          revokedDeviceCount: vaultRotations.revokedDeviceCount,
        })
        .from(vaultRotations)
        .where(
          and(
            eq(vaultRotations.vaultId, request.vaultId),
            eq(vaultRotations.idempotencyKey, request.idempotencyKey),
            eq(vaultRotations.userId, request.userId),
          ),
        );
      if (existing[0] !== undefined) {
        return {
          status: 'rotated',
          keyId: existing[0].keyId,
          revokedDeviceCount: existing[0].revokedDeviceCount,
        };
      }

      const keysets = await transaction
        .select({ keysetId: vaultKeysets.id, keyId: vaultKeysets.keyId })
        .from(vaultKeysets)
        .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
        .where(
          and(
            eq(vaultKeysets.vaultId, request.vaultId),
            eq(vaults.workspaceId, request.workspaceId),
            eq(vaultKeysets.keyId, request.currentKeyId),
          ),
        );
      const keyset = keysets[0];
      if (keyset === undefined)
        throw new ConflictException('Vault key has changed');

      const devices = await transaction
        .select({
          id: vaultDevices.id,
          deviceId: vaultDevices.deviceId,
          userId: vaultDevices.userId,
          revoked: vaultDevices.revoked,
          status: vaultDevices.status,
        })
        .from(vaultDevices)
        .where(eq(vaultDevices.keysetId, keyset.keysetId));
      const initiator = devices.find(
        (device) =>
          device.deviceId === request.deviceId &&
          device.userId === request.userId &&
          !device.revoked &&
          (device.status === 'active' || device.status === 'high-security'),
      );
      if (initiator === undefined)
        throw new NotFoundException('Vault device not found');
      if (
        initiator.status === 'high-security' &&
        request.envelopePurpose !== 'passkey-wrap'
      )
        throw new ConflictException(
          'High-security rotation requires passkey PRF',
        );
      const otherDevices = devices.filter(
        (device) => device.id !== initiator.id,
      );
      const otherDeviceIds = otherDevices.map((device) => device.id);
      const revocableOtherDeviceIds = otherDevices
        .filter((device) => !device.revoked)
        .map((device) => device.id);
      const activeOtherDeviceCount = otherDevices.filter(
        (device) =>
          !device.revoked &&
          (device.status === 'active' || device.status === 'high-security'),
      ).length;
      const now = new Date();

      await transaction
        .delete(vaultSyncSnapshots)
        .where(eq(vaultSyncSnapshots.vaultId, request.vaultId));
      if (devices.length > 0) {
        await transaction.delete(vaultDeviceEnvelopes).where(
          inArray(
            vaultDeviceEnvelopes.deviceId,
            devices.map((device) => device.id),
          ),
        );
      }
      if (otherDeviceIds.length > 0) {
        await transaction
          .delete(vaultServerShares)
          .where(inArray(vaultServerShares.deviceId, otherDeviceIds));
        if (revocableOtherDeviceIds.length > 0) {
          await transaction
            .update(vaultDevices)
            .set({
              revoked: true,
              status: 'revoked',
              revokedAt: now,
              lastSeenAt: now,
            })
            .where(inArray(vaultDevices.id, revocableOtherDeviceIds));
        }
      }
      await transaction
        .update(vaultKeysets)
        .set({
          keyId: request.nextKeyId,
          protocolVersion: request.protocolVersion,
          cryptoSuite: request.cryptoSuite,
          updatedAt: now,
        })
        .where(eq(vaultKeysets.id, keyset.keysetId));
      await transaction.insert(vaultDeviceEnvelopes).values({
        id: randomUUID(),
        deviceId: initiator.id,
        keysetId: keyset.keysetId,
        purpose: request.envelopePurpose,
        envelope: request.envelope,
        protocolVersion: request.protocolVersion,
        createdAt: now,
        updatedAt: now,
      });
      if (request.passkeyEnvelope !== undefined) {
        await transaction.insert(vaultDeviceEnvelopes).values({
          id: randomUUID(),
          deviceId: initiator.id,
          keysetId: keyset.keysetId,
          purpose: 'passkey-wrap',
          envelope: request.passkeyEnvelope,
          protocolVersion: request.protocolVersion,
          createdAt: now,
          updatedAt: now,
        });
      }
      const revokedDeviceCount = activeOtherDeviceCount;
      await transaction.insert(vaultRotations).values({
        id: randomUUID(),
        vaultId: request.vaultId,
        userId: request.userId,
        deviceId: initiator.id,
        idempotencyKey: request.idempotencyKey,
        currentKeyId: request.currentKeyId,
        nextKeyId: request.nextKeyId,
        envelopePurpose: request.envelopePurpose,
        envelope: request.envelope,
        protocolVersion: request.protocolVersion,
        cryptoSuite: request.cryptoSuite,
        revokedDeviceCount,
        createdAt: now,
      });
      return {
        status: 'rotated',
        keyId: request.nextKeyId,
        revokedDeviceCount,
      };
    });
  }
}
