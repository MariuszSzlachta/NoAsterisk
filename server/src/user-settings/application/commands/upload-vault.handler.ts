import { ConflictException, Injectable, Inject } from '@nestjs/common';
import { VaultRepository } from '@user-settings/domain/ports/vault-repository';
import { VAULT_REPOSITORY } from '@user-settings/domain/ports/vault-token';
import { Vault } from '@user-settings/domain/vault.entity';
import { createVaultContentHash } from '@user-settings/application/opaque-vault/create-vault-content-hash';
import { getVaultByteSize } from '@user-settings/application/opaque-vault/get-vault-byte-size';
import { UploadVaultCommand } from '@user-settings/application/commands/upload-vault.command';
import { UploadVaultResult } from '@user-settings/application/commands/upload-vault.result';

@Injectable()
export class UploadVaultHandler {
  constructor(
    @Inject(VAULT_REPOSITORY) private readonly vaultRepository: VaultRepository,
  ) {}

  async execute(command: UploadVaultCommand): Promise<UploadVaultResult> {
    const contentHash = createVaultContentHash(command.encryptedBlob);
    const byteSize = getVaultByteSize(command.encryptedBlob);
    const existing = await this.vaultRepository.findByWorkspaceId(
      command.workspaceId,
    );

    const vault = existing
      ? existing.updateBlob(command.encryptedBlob, contentHash, byteSize)
      : Vault.create({
          workspaceId: command.workspaceId,
          encryptedBlob: command.encryptedBlob,
          contentHash,
          byteSize,
        });

    const writeResult = await this.vaultRepository.saveIfRevisionMatches(
      vault,
      command.baseRevision,
    );
    if (writeResult.status === 'conflict') {
      throw new ConflictException('Vault revision conflict');
    }

    return {
      encryptedBlob: writeResult.vault.encryptedBlob,
      byteSize: writeResult.vault.byteSize,
      revision: writeResult.vault.revision,
      contentHash: writeResult.vault.contentHash,
      createdAt: writeResult.vault.createdAt.toISOString(),
      updatedAt: writeResult.vault.updatedAt.toISOString(),
    };
  }
}
