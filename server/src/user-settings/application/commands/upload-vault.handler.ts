import { Injectable, Inject } from '@nestjs/common';
import {
  VAULT_REPOSITORY,
  VaultRepository,
} from '@user-settings/domain/ports/vault.repository';
import { Vault } from '@user-settings/domain/vault.entity';

export interface UploadVaultCommand {
  workspaceId: string;
  encryptedBlob: string;
}

export interface UploadVaultResult {
  updatedAt: string;
}

@Injectable()
export class UploadVaultHandler {
  constructor(
    @Inject(VAULT_REPOSITORY) private readonly vaultRepo: VaultRepository,
  ) {}

  async execute(command: UploadVaultCommand): Promise<UploadVaultResult> {
    const existing = await this.vaultRepo.findByWorkspaceId(
      command.workspaceId,
    );

    const vault = existing
      ? existing.updateBlob(command.encryptedBlob)
      : Vault.create({
          workspaceId: command.workspaceId,
          encryptedBlob: command.encryptedBlob,
        });

    await this.vaultRepo.save(vault);

    return { updatedAt: vault.updatedAt.toISOString() };
  }
}
