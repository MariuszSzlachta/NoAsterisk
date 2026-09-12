import { Injectable } from '@nestjs/common';
import type {
  SyncSnapshot,
  SyncSnapshotRepository,
} from '@vault-protocol/domain/ports/sync-snapshot.repository';

interface StoredSnapshot {
  readonly userId: string;
  readonly workspaceId: string;
  readonly snapshot: SyncSnapshot;
}

@Injectable()
export class InMemorySyncSnapshotRepository implements SyncSnapshotRepository {
  private readonly snapshots = new Map<string, StoredSnapshot>();

  async findLatest(
    userId: string,
    workspaceId: string,
    vaultId: string,
  ): Promise<SyncSnapshot | undefined> {
    const stored = this.snapshots.get(vaultId);
    if (
      !stored ||
      stored.userId !== userId ||
      stored.workspaceId !== workspaceId
    )
      return undefined;
    return stored.snapshot;
  }

  async saveIfCurrent(
    userId: string,
    workspaceId: string,
    snapshot: SyncSnapshot,
    expectedRevision: number,
  ): Promise<'saved' | 'conflict' | 'forbidden'> {
    const current = this.snapshots.get(snapshot.vaultId);
    if (
      current &&
      (current.userId !== userId || current.workspaceId !== workspaceId)
    )
      return 'forbidden';
    if (current && current.snapshot.revision !== expectedRevision)
      return 'conflict';
    if (snapshot.revision !== expectedRevision + 1) return 'conflict';
    this.snapshots.set(snapshot.vaultId, { userId, workspaceId, snapshot });
    return 'saved';
  }
}
