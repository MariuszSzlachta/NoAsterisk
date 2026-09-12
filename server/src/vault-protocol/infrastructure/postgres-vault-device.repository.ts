import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import {
  vaultDevices,
  vaultKeysets,
  vaults,
} from '@shared/infrastructure/database/schema';
import type {
  VaultDeviceRepository,
  VaultDeviceSummary,
} from '@vault-protocol/domain/ports/vault-device.repository';

const mapDevice = (row: {
  readonly deviceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly lastSeenAt: Date;
  readonly signingPublicKey: string | null;
  readonly revokedAt: Date | null;
}): VaultDeviceSummary => ({
  deviceId: row.deviceId,
  vaultId: row.vaultId,
  keyId: row.keyId,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
  lastSeenAt: row.lastSeenAt.toISOString(),
  ...(row.signingPublicKey === null
    ? {}
    : { signingPublicKey: row.signingPublicKey }),
  ...(row.revokedAt === null ? {} : { revokedAt: row.revokedAt.toISOString() }),
});

@Injectable()
export class PostgresVaultDeviceRepository implements VaultDeviceRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async list(
    userId: string,
    workspaceId: string,
  ): Promise<ReadonlyArray<VaultDeviceSummary>> {
    const rows = await this.db
      .select({
        deviceId: vaultDevices.deviceId,
        vaultId: vaults.id,
        keyId: vaultKeysets.keyId,
        status: vaultDevices.status,
        createdAt: vaultDevices.createdAt,
        lastSeenAt: vaultDevices.lastSeenAt,
        signingPublicKey: vaultDevices.signingPublicKey,
        revokedAt: vaultDevices.revokedAt,
      })
      .from(vaultDevices)
      .innerJoin(vaultKeysets, eq(vaultDevices.keysetId, vaultKeysets.id))
      .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
      .where(
        and(
          eq(vaultDevices.userId, userId),
          eq(vaults.workspaceId, workspaceId),
        ),
      );
    return rows.map(mapDevice);
  }

  async revoke(
    userId: string,
    workspaceId: string,
    deviceId: string,
  ): Promise<void> {
    const devices = await this.db
      .select({ id: vaultDevices.id })
      .from(vaultDevices)
      .innerJoin(vaultKeysets, eq(vaultDevices.keysetId, vaultKeysets.id))
      .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
      .where(
        and(
          eq(vaultDevices.userId, userId),
          eq(vaultDevices.deviceId, deviceId),
          eq(vaults.workspaceId, workspaceId),
        ),
      );
    const row = devices[0];
    if (row === undefined) return;
    const now = new Date();
    await this.db
      .update(vaultDevices)
      .set({
        revoked: true,
        revokedAt: now,
        status: 'revoked',
        lastSeenAt: now,
      })
      .where(eq(vaultDevices.id, row.id));
  }
}
