import { Injectable, Inject } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { Vault } from '@user-settings/domain/vault.entity';
import { VaultRepository } from '@user-settings/domain/ports/vault-repository';
import { VaultWriteResult } from '@user-settings/domain/ports/vault-write-result';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { vaults } from '@shared/infrastructure/database/schema';

@Injectable()
export class PostgresVaultRepository implements VaultRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async findByWorkspaceId(workspaceId: string): Promise<Vault | undefined> {
    const rows = await this.db
      .select()
      .from(vaults)
      .where(eq(vaults.workspaceId, workspaceId));
    const row = rows[0];
    if (!row) return undefined;
    return new Vault(
      row.id,
      row.workspaceId,
      row.encryptedBlob,
      row.contentHash,
      row.byteSize,
      row.revision,
      row.createdAt,
      row.updatedAt,
    );
  }

  async saveIfRevisionMatches(
    vault: Vault,
    baseRevision: number,
  ): Promise<VaultWriteResult> {
    const insertedRows = await this.db
      .insert(vaults)
      .values({
        id: vault.id,
        workspaceId: vault.workspaceId,
        encryptedBlob: vault.encryptedBlob,
        contentHash: vault.contentHash,
        byteSize: vault.byteSize,
        revision: vault.revision,
        createdAt: vault.createdAt,
        updatedAt: vault.updatedAt,
      })
      .onConflictDoNothing({ target: vaults.workspaceId })
      .returning();
    if (insertedRows.length > 0) return { status: 'saved', vault };

    const updatedRows = await this.db
      .update(vaults)
      .set({
        encryptedBlob: vault.encryptedBlob,
        contentHash: vault.contentHash,
        byteSize: vault.byteSize,
        revision: sql`${vaults.revision} + 1`,
        updatedAt: vault.updatedAt,
      })
      .where(
        and(
          eq(vaults.workspaceId, vault.workspaceId),
          eq(vaults.revision, baseRevision),
        ),
      )
      .returning();
    if (updatedRows.length > 0) return { status: 'saved', vault };

    const currentVault = await this.findByWorkspaceId(vault.workspaceId);
    if (currentVault?.contentHash === vault.contentHash) {
      return { status: 'saved', vault: currentVault };
    }
    return { status: 'conflict' };
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    await this.db.delete(vaults).where(eq(vaults.workspaceId, workspaceId));
  }
}
