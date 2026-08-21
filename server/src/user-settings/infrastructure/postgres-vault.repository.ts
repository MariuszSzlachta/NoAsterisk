import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Vault } from '@user-settings/domain/vault.entity';
import { VaultRepository } from '@user-settings/domain/ports/vault.repository';
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
      row.createdAt,
      row.updatedAt,
    );
  }

  async save(vault: Vault): Promise<void> {
    await this.db
      .insert(vaults)
      .values({
        id: vault.id,
        workspaceId: vault.workspaceId,
        encryptedBlob: vault.encryptedBlob,
        createdAt: vault.createdAt,
        updatedAt: vault.updatedAt,
      })
      .onConflictDoUpdate({
        target: vaults.id,
        set: {
          encryptedBlob: vault.encryptedBlob,
          updatedAt: vault.updatedAt,
        },
      });
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    await this.db.delete(vaults).where(eq(vaults.workspaceId, workspaceId));
  }
}
