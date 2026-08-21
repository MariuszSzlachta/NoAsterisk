import { Injectable } from '@nestjs/common';
import { VaultRepository } from '@user-settings/domain/ports/vault.repository';
import { Vault } from '@user-settings/domain/vault.entity';

@Injectable()
export class InMemoryVaultRepository implements VaultRepository {
  private readonly store = new Map<string, Vault>();

  async findByWorkspaceId(workspaceId: string): Promise<Vault | undefined> {
    return [...this.store.values()].find((v) => v.workspaceId === workspaceId);
  }

  async save(vault: Vault): Promise<void> {
    this.store.set(vault.id, vault);
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    for (const [key, vault] of this.store.entries()) {
      if (vault.workspaceId === workspaceId) {
        this.store.delete(key);
      }
    }
  }
}
