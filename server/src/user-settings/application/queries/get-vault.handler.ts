import { Injectable, Inject } from '@nestjs/common';
import { VaultRepository } from '@user-settings/domain/ports/vault-repository';
import { VAULT_REPOSITORY } from '@user-settings/domain/ports/vault-token';
import { VaultResult } from '@user-settings/application/queries/vault-result';
import { GetVaultQuery } from '@user-settings/application/queries/get-vault.query';

@Injectable()
export class GetVaultHandler {
  constructor(
    @Inject(VAULT_REPOSITORY) private readonly vaultRepository: VaultRepository,
  ) {}

  async execute(query: GetVaultQuery): Promise<VaultResult> {
    const vault = await this.vaultRepository.findByWorkspaceId(
      query.workspaceId,
    );
    if (!vault) return { status: 'empty' };

    return {
      status: 'available',
      encryptedBlob: vault.encryptedBlob,
      byteSize: vault.byteSize,
      revision: vault.revision,
      contentHash: vault.contentHash,
      createdAt: vault.createdAt.toISOString(),
      updatedAt: vault.updatedAt.toISOString(),
    };
  }
}
