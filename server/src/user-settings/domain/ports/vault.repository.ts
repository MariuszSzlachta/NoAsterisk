import { Vault } from '@user-settings/domain/vault.entity';

export const VAULT_REPOSITORY = Symbol('VAULT_REPOSITORY');

export interface VaultRepository {
  findByWorkspaceId(workspaceId: string): Promise<Vault | undefined>;
  save(vault: Vault): Promise<void>;
  deleteByWorkspaceId(workspaceId: string): Promise<void>;
}
