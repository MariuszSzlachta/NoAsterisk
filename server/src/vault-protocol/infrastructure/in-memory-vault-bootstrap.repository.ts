import { Injectable } from '@nestjs/common';
import type {
  VaultBootstrap,
  VaultBootstrapRepository,
} from '@vault-protocol/domain/ports/vault-bootstrap.repository';
import { InMemoryVaultProtocolState } from './in-memory-vault-protocol-state';

@Injectable()
export class InMemoryVaultBootstrapRepository implements VaultBootstrapRepository {
  constructor(
    private readonly state: InMemoryVaultProtocolState = new InMemoryVaultProtocolState(),
  ) {}

  async get(
    userId: string,
    workspaceId: string,
    deviceId: string,
  ): Promise<VaultBootstrap> {
    return this.state.getBootstrap(userId, workspaceId, deviceId);
  }
}
