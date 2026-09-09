import { Vault } from '@user-settings/domain/vault.entity';
import { VaultWriteResult } from '@user-settings/domain/ports/vault-write-result';

export interface VaultRepository {
  findByWorkspaceId(workspaceId: string): Promise<Vault | undefined>;
  saveIfRevisionMatches(
    vault: Vault,
    baseRevision: number,
  ): Promise<VaultWriteResult>;
  deleteByWorkspaceId(workspaceId: string): Promise<void>;
}
