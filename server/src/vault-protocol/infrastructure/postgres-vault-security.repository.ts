import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import {
  vaultDeviceEnvelopes,
  vaultDevices,
  vaultKeysets,
  vaults,
} from '@shared/infrastructure/database/schema';
import type {
  EnableHighSecurityRequest,
  VaultSecurityRepository,
} from '@vault-protocol/domain/ports/vault-security.repository';

@Injectable()
export class PostgresVaultSecurityRepository implements VaultSecurityRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async enablePasskeyUnlock(request: EnableHighSecurityRequest): Promise<void> {
    await this.db.transaction(async (transaction) => {
      const devices = await transaction
        .select({
          deviceRowId: vaultDevices.id,
          keysetRowId: vaultKeysets.id,
        })
        .from(vaultDevices)
        .innerJoin(vaultKeysets, eq(vaultKeysets.id, vaultDevices.keysetId))
        .innerJoin(vaults, eq(vaults.id, vaultKeysets.vaultId))
        .where(
          and(
            eq(vaultDevices.userId, request.userId),
            eq(vaults.workspaceId, request.workspaceId),
            eq(vaults.id, request.vaultId),
            eq(vaultKeysets.keyId, request.keyId),
            eq(vaultDevices.deviceId, request.deviceId),
            eq(vaultDevices.revoked, false),
            inArray(vaultDevices.status, ['active', 'high-security']),
          ),
        );
      const device = devices[0];
      if (device === undefined) throw new Error('Vault device not found');
      const existing = await transaction
        .select({ id: vaultDeviceEnvelopes.id })
        .from(vaultDeviceEnvelopes)
        .where(
          and(
            eq(vaultDeviceEnvelopes.deviceId, device.deviceRowId),
            eq(vaultDeviceEnvelopes.purpose, 'passkey-wrap'),
          ),
        );
      const now = new Date();
      if (existing[0] === undefined) {
        await transaction.insert(vaultDeviceEnvelopes).values({
          id: randomUUID(),
          deviceId: device.deviceRowId,
          keysetId: device.keysetRowId,
          purpose: 'passkey-wrap',
          envelope: request.passkeyEnvelope,
          protocolVersion: '2',
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await transaction
          .update(vaultDeviceEnvelopes)
          .set({ envelope: request.passkeyEnvelope, updatedAt: now })
          .where(eq(vaultDeviceEnvelopes.id, existing[0].id));
      }
    });
  }

  async enableHighSecurity(request: EnableHighSecurityRequest): Promise<void> {
    await this.db.transaction(async (transaction) => {
      const devices = await transaction
        .select({
          deviceRowId: vaultDevices.id,
          keysetRowId: vaultKeysets.id,
          keyId: vaultKeysets.keyId,
        })
        .from(vaultDevices)
        .innerJoin(vaultKeysets, eq(vaultKeysets.id, vaultDevices.keysetId))
        .innerJoin(vaults, eq(vaults.id, vaultKeysets.vaultId))
        .where(
          and(
            eq(vaultDevices.userId, request.userId),
            eq(vaults.workspaceId, request.workspaceId),
            eq(vaults.id, request.vaultId),
            eq(vaultKeysets.keyId, request.keyId),
            eq(vaultDevices.deviceId, request.deviceId),
            eq(vaultDevices.revoked, false),
            inArray(vaultDevices.status, ['active', 'high-security']),
          ),
        );
      const device = devices[0];
      if (device === undefined) throw new Error('Vault device not found');

      await transaction
        .delete(vaultDeviceEnvelopes)
        .where(
          and(
            eq(vaultDeviceEnvelopes.deviceId, device.deviceRowId),
            eq(vaultDeviceEnvelopes.purpose, 'device-wrap'),
          ),
        );

      const existing = await transaction
        .select({ id: vaultDeviceEnvelopes.id })
        .from(vaultDeviceEnvelopes)
        .where(
          and(
            eq(vaultDeviceEnvelopes.deviceId, device.deviceRowId),
            eq(vaultDeviceEnvelopes.purpose, 'passkey-wrap'),
          ),
        );
      const now = new Date();
      if (existing[0] === undefined) {
        await transaction.insert(vaultDeviceEnvelopes).values({
          id: randomUUID(),
          deviceId: device.deviceRowId,
          keysetId: device.keysetRowId,
          purpose: 'passkey-wrap',
          envelope: request.passkeyEnvelope,
          protocolVersion: '2',
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await transaction
          .update(vaultDeviceEnvelopes)
          .set({ envelope: request.passkeyEnvelope, updatedAt: now })
          .where(eq(vaultDeviceEnvelopes.id, existing[0].id));
      }
      await transaction
        .update(vaultDevices)
        .set({ status: 'high-security', lastSeenAt: now })
        .where(eq(vaultDevices.id, device.deviceRowId));
    });
  }

  async disableHighSecurity(request: EnableHighSecurityRequest): Promise<void> {
    await this.db.transaction(async (transaction) => {
      const devices = await transaction
        .select({ deviceRowId: vaultDevices.id, keysetRowId: vaultKeysets.id })
        .from(vaultDevices)
        .innerJoin(vaultKeysets, eq(vaultKeysets.id, vaultDevices.keysetId))
        .innerJoin(vaults, eq(vaults.id, vaultKeysets.vaultId))
        .where(
          and(
            eq(vaultDevices.userId, request.userId),
            eq(vaults.workspaceId, request.workspaceId),
            eq(vaults.id, request.vaultId),
            eq(vaultKeysets.keyId, request.keyId),
            eq(vaultDevices.deviceId, request.deviceId),
            eq(vaultDevices.revoked, false),
            inArray(vaultDevices.status, ['active', 'high-security']),
          ),
        );
      const device = devices[0];
      if (device === undefined) throw new Error('Vault device not found');
      const existing = await transaction
        .select({ id: vaultDeviceEnvelopes.id })
        .from(vaultDeviceEnvelopes)
        .where(
          and(
            eq(vaultDeviceEnvelopes.deviceId, device.deviceRowId),
            eq(vaultDeviceEnvelopes.purpose, 'device-wrap'),
          ),
        );
      const now = new Date();
      if (existing[0] === undefined) {
        await transaction.insert(vaultDeviceEnvelopes).values({
          id: randomUUID(),
          deviceId: device.deviceRowId,
          keysetId: device.keysetRowId,
          purpose: 'device-wrap',
          envelope: request.passkeyEnvelope,
          protocolVersion: '2',
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await transaction
          .update(vaultDeviceEnvelopes)
          .set({ envelope: request.passkeyEnvelope, updatedAt: now })
          .where(eq(vaultDeviceEnvelopes.id, existing[0].id));
      }
      await transaction
        .update(vaultDevices)
        .set({ status: 'active', lastSeenAt: now })
        .where(eq(vaultDevices.id, device.deviceRowId));
    });
  }
}
