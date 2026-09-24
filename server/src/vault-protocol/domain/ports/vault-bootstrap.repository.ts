export type { VaultBootstrap } from './vault-bootstrap.types';
import type { VaultBootstrap } from './vault-bootstrap.types';

export interface VaultBootstrapRepository {
  get(
    userId: string,
    workspaceId: string,
    deviceId: string,
  ): Promise<VaultBootstrap>;
}
