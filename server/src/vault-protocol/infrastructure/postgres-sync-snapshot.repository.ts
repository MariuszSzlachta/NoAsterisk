import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import {
  vaultDevices,
  vaultKeysets,
  vaults,
  vaultSyncSnapshots,
} from '@shared/infrastructure/database/schema';
import type {
  SyncSnapshot,
  SyncSnapshotRepository,
} from '@vault-protocol/domain/ports/sync-snapshot.repository';
import { deviceSnapshotSignature } from './verify-device-snapshot-signature';

@Injectable()
export class PostgresSyncSnapshotRepository implements SyncSnapshotRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async findLatest(
    userId: string,
    workspaceId: string,
    vaultId: string,
  ): Promise<SyncSnapshot | undefined> {
    const rows = await this.db
      .select({
        snapshot: vaultSyncSnapshots,
        signingPublicKey: vaultDevices.signingPublicKey,
      })
      .from(vaultSyncSnapshots)
      .innerJoin(vaults, eq(vaultSyncSnapshots.vaultId, vaults.id))
      .innerJoin(
        vaultKeysets,
        eq(vaultSyncSnapshots.vaultId, vaultKeysets.vaultId),
      )
      .innerJoin(vaultDevices, eq(vaultSyncSnapshots.deviceId, vaultDevices.id))
      .where(
        and(
          eq(vaults.id, vaultId),
          eq(vaults.workspaceId, workspaceId),
          eq(vaultDevices.userId, userId),
          eq(vaultDevices.revoked, false),
          inArray(vaultDevices.status, ['active', 'high-security']),
        ),
      )
      .orderBy(desc(vaultSyncSnapshots.revision))
      .limit(1);
    const row = rows[0]?.snapshot;
    const signingPublicKey = rows[0]?.signingPublicKey;
    return row && signingPublicKey
      ? {
          vaultId: row.vaultId,
          keyId: row.keyId,
          deviceId: row.deviceId,
          revision: row.revision,
          previousEnvelopeHash: row.previousEnvelopeHash,
          envelopeHash: row.envelopeHash,
          header: row.header,
          ciphertext: row.ciphertext,
          signature: row.signature,
          signingPublicKey,
          createdAt: row.createdAt.toISOString(),
        }
      : undefined;
  }

  async saveIfCurrent(
    userId: string,
    workspaceId: string,
    snapshot: SyncSnapshot,
    expectedRevision: number,
  ): Promise<'saved' | 'conflict' | 'forbidden'> {
    const deviceRows = await this.db
      .select({
        deviceId: vaultDevices.id,
        keyId: vaultKeysets.keyId,
        signingPublicKey: vaultDevices.signingPublicKey,
      })
      .from(vaultDevices)
      .innerJoin(vaultKeysets, eq(vaultDevices.keysetId, vaultKeysets.id))
      .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
      .where(
        and(
          eq(vaultDevices.userId, userId),
          eq(vaultDevices.deviceId, snapshot.deviceId),
          eq(vaults.id, snapshot.vaultId),
          eq(vaults.workspaceId, workspaceId),
          eq(vaultDevices.revoked, false),
          inArray(vaultDevices.status, ['active', 'high-security']),
        ),
      );
    const device = deviceRows[0];
    if (!device) return 'forbidden';

    if (device.keyId !== snapshot.keyId) return 'forbidden';
    if (
      !(await deviceSnapshotSignature.verify({
        signingPublicKey: device.signingPublicKey,
        accountId: userId,
        workspaceId,
        snapshot,
      }))
    )
      return 'forbidden';
    const latest = await this.findLatest(userId, workspaceId, snapshot.vaultId);
    if (
      (latest?.revision ?? 0) !== expectedRevision ||
      snapshot.revision !== expectedRevision + 1
    )
      return 'conflict';

    const inserted = await this.db
      .insert(vaultSyncSnapshots)
      .values({
        id: randomUUID(),
        vaultId: snapshot.vaultId,
        deviceId: device.deviceId,
        keyId: snapshot.keyId,
        revision: snapshot.revision,
        envelopeHash: snapshot.envelopeHash,
        previousEnvelopeHash: snapshot.previousEnvelopeHash,
        header: snapshot.header,
        ciphertext: snapshot.ciphertext,
        signature: snapshot.signature,
        createdAt: new Date(snapshot.createdAt),
      })
      .onConflictDoNothing()
      .returning({ id: vaultSyncSnapshots.id });
    return inserted.length > 0 ? 'saved' : 'conflict';
  }
}
