import { Inject, Injectable } from '@nestjs/common';
import { VAULT_BOOTSTRAP_REPOSITORY } from '@vault-protocol/domain/ports/vault-bootstrap.token';
import type {
  VaultBootstrap,
  VaultBootstrapRepository,
} from '@vault-protocol/domain/ports/vault-bootstrap.repository';

@Injectable()
export class GetVaultBootstrapHandler {
  constructor(
    @Inject(VAULT_BOOTSTRAP_REPOSITORY)
    private readonly repository: VaultBootstrapRepository,
  ) {}

  execute(
    userId: string,
    workspaceId: string,
    deviceId: string,
  ): Promise<VaultBootstrap> {
    if (deviceId.length === 0) throw new Error('Device ID cannot be empty');
    return this.repository.get(userId, workspaceId, deviceId);
  }
}
