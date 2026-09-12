import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import {
  vaultDevices,
  vaultKeysets,
  vaults,
  vaultServerShares,
} from '@shared/infrastructure/database/schema';
import type { ServerShareRepository } from '@vault-protocol/domain/ports/server-share.repository';
import { ServerShareEncryptionAdapter } from '@vault-protocol/infrastructure/server-share-encryption.adapter';

@Injectable()
export class PostgresServerShareRepository implements ServerShareRepository {
  private readonly encryption = new ServerShareEncryptionAdapter();

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async enroll(
    _userId: string,
    _workspaceId: string,
    _deviceId: string,
  ): Promise<void> {
    throw new Error('Device enrollment requires recovery or approved QR flow');
  }

  async issue(
    userId: string,
    workspaceId: string,
    deviceId: string,
  ): Promise<Uint8Array | undefined> {
    const rows = await this.db
      .select({
        ciphertext: vaultServerShares.ciphertext,
        nonce: vaultServerShares.nonce,
        authTag: vaultServerShares.authTag,
        infrastructureKeyVersion: vaultServerShares.infrastructureKeyVersion,
      })
      .from(vaultServerShares)
      .innerJoin(vaultDevices, eq(vaultServerShares.deviceId, vaultDevices.id))
      .innerJoin(vaultKeysets, eq(vaultDevices.keysetId, vaultKeysets.id))
      .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
      .where(
        and(
          eq(vaultDevices.userId, userId),
          eq(vaultDevices.deviceId, deviceId),
          eq(vaultDevices.revoked, false),
          inArray(vaultDevices.status, ['active', 'high-security']),
          eq(vaults.workspaceId, workspaceId),
        ),
      );
    const row = rows[0];
    if (!row) return undefined;
    return this.encryption.decrypt(row);
  }
}
