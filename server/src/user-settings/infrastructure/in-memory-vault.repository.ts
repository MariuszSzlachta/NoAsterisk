import { Injectable } from '@nestjs/common';
import { VaultRepository } from '@user-settings/domain/ports/vault-repository';
import { VaultWriteResult } from '@user-settings/domain/ports/vault-write-result';
import { Vault } from '@user-settings/domain/vault.entity';

@Injectable()
export class InMemoryVaultRepository implements VaultRepository {
  private readonly store = new Map<string, Vault>();

  async findByWorkspaceId(workspaceId: string): Promise<Vault | undefined> {
    return [...this.store.values()].find((v) => v.workspaceId === workspaceId);
  }

  async saveIfRevisionMatches(
    vault: Vault,
    baseRevision: number,
  ): Promise<VaultWriteResult> {
    const currentVault = this.store.get(vault.workspaceId);
    if (!currentVault && baseRevision === 0) {
      this.store.set(vault.workspaceId, vault);
      return { status: 'saved', vault };
    }
    if (currentVault?.contentHash === vault.contentHash) {
      return { status: 'saved', vault: currentVault };
    }
    if (currentVault?.revision !== baseRevision) return { status: 'conflict' };

    this.store.set(vault.workspaceId, vault);
    return { status: 'saved', vault };
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    this.store.delete(workspaceId);
  }
}
