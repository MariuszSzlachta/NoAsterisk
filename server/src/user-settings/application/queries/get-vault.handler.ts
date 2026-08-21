import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  VAULT_REPOSITORY,
  VaultRepository,
} from '@user-settings/domain/ports/vault.repository';

export interface GetVaultQuery {
  workspaceId: string;
}

export interface VaultResult {
  encryptedBlob: string;
  updatedAt: string;
}

@Injectable()
export class GetVaultHandler {
  constructor(
    @Inject(VAULT_REPOSITORY) private readonly vaultRepo: VaultRepository,
  ) {}

  async execute(query: GetVaultQuery): Promise<VaultResult> {
    const vault = await this.vaultRepo.findByWorkspaceId(query.workspaceId);
    if (!vault) {
      throw new NotFoundException('Vault not found');
    }

    return {
      encryptedBlob: vault.encryptedBlob,
      updatedAt: vault.updatedAt.toISOString(),
    };
  }
}
