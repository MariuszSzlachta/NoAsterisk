import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { createHash, randomUUID } from 'node:crypto';
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

const sortCanonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortCanonical);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, sortCanonical(nested)]),
  );
};

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
        logicalDeviceId: vaultDevices.deviceId,
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
          deviceId: rows[0]?.logicalDeviceId ?? row.deviceId,
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
    return this.db.transaction(async (transaction) => {
      // Serialize the complete read/validate/insert chain per vault.  A plain
      // select followed by an insert allows two writers to both observe the
      // same high-water mark before either insert commits.
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${snapshot.vaultId}, 0))`,
      );
      const deviceRows = await transaction
        .select({
          deviceId: vaultDevices.id,
          logicalDeviceId: vaultDevices.deviceId,
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

      if (
        device.keyId !== snapshot.keyId ||
        device.logicalDeviceId !== snapshot.deviceId
      )
        return 'forbidden';
      if (
        !(await deviceSnapshotSignature.verify({
          signingPublicKey: device.signingPublicKey,
          accountId: userId,
          workspaceId,
          snapshot,
        }))
      )
        return 'forbidden';
      const latestRows = await transaction
        .select({ snapshot: vaultSyncSnapshots })
        .from(vaultSyncSnapshots)
        .innerJoin(vaults, eq(vaultSyncSnapshots.vaultId, vaults.id))
        .where(
          and(
            eq(vaults.id, snapshot.vaultId),
            eq(vaults.workspaceId, workspaceId),
          ),
        )
        .orderBy(desc(vaultSyncSnapshots.revision))
        .limit(1);
      const latest = latestRows[0]?.snapshot;
      if (
        (latest?.revision ?? 0) !== expectedRevision ||
        snapshot.revision !== expectedRevision + 1
      )
        return 'conflict';

      let header: unknown;
      try {
        header = JSON.parse(snapshot.header);
      } catch {
        return 'forbidden';
      }
      const calculatedEnvelopeHash = createHash('sha256')
        .update(
          JSON.stringify(
            sortCanonical({
              header,
              ciphertext: snapshot.ciphertext,
              signature: snapshot.signature,
            }),
          ),
        )
        .digest('base64');
      if (calculatedEnvelopeHash !== snapshot.envelopeHash) return 'forbidden';
      if (
        latest !== undefined &&
        snapshot.previousEnvelopeHash !== latest.envelopeHash
      )
        return 'conflict';
      const inserted = await transaction
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
    });
  }
}
