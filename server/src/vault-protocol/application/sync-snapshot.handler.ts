import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { SYNC_SNAPSHOT_REPOSITORY } from '@vault-protocol/domain/ports/sync-snapshot.token';
import type { SyncSnapshotRepository } from '@vault-protocol/domain/ports/sync-snapshot.repository';
import { syncSnapshotSchema } from '@vault-protocol/application/sync-snapshot.contract';
import type { z } from 'zod';

type SyncSnapshotDto = z.infer<typeof syncSnapshotSchema>;
type SyncSnapshotReadResult =
  | {
      readonly status: 'available';
      readonly snapshot: Awaited<
        ReturnType<SyncSnapshotRepository['findLatest']>
      > extends infer T
        ? Exclude<T, undefined>
        : never;
    }
  | { readonly status: 'empty' };

@Injectable()
export class SyncSnapshotHandler {
  constructor(
    @Inject(SYNC_SNAPSHOT_REPOSITORY)
    private readonly repository: SyncSnapshotRepository,
  ) {}

  async get(
    userId: string,
    workspaceId: string,
    vaultId: string,
  ): Promise<SyncSnapshotReadResult> {
    const snapshot = await this.repository.findLatest(
      userId,
      workspaceId,
      vaultId,
    );
    return snapshot ? { status: 'available', snapshot } : { status: 'empty' };
  }

  async put(
    userId: string,
    workspaceId: string,
    dto: SyncSnapshotDto,
    expectedRevision: number,
  ): Promise<{
    readonly status: 'saved';
    readonly revision: number;
    readonly envelopeHash: string;
  }> {
    const result = await this.repository.saveIfCurrent(
      userId,
      workspaceId,
      dto,
      expectedRevision,
    );
    if (result === 'forbidden')
      throw new ForbiddenException('Vault access denied');
    if (result === 'conflict')
      throw new ConflictException('Vault snapshot revision conflict');
    return {
      status: 'saved',
      revision: dto.revision,
      envelopeHash: dto.envelopeHash,
    };
  }
}
