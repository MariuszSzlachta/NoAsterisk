import { Injectable } from '@nestjs/common';
import type {
  EnableHighSecurityRequest,
  VaultSecurityRepository,
} from '@vault-protocol/domain/ports/vault-security.repository';

@Injectable()
export class InMemoryVaultSecurityRepository implements VaultSecurityRepository {
  private readonly highSecurityDevices = new Map<
    string,
    EnableHighSecurityRequest
  >();
  private readonly passkeyDevices = new Map<
    string,
    EnableHighSecurityRequest
  >();

  async enableHighSecurity(request: EnableHighSecurityRequest): Promise<void> {
    if (request.passkeyEnvelope.length === 0)
      throw new Error('Passkey envelope is required');
    this.highSecurityDevices.set(
      `${request.userId}:${request.workspaceId}:${request.vaultId}:${request.deviceId}`,
      request,
    );
  }

  async enablePasskeyUnlock(request: EnableHighSecurityRequest): Promise<void> {
    if (request.passkeyEnvelope.length === 0)
      throw new Error('Passkey envelope is required');
    this.passkeyDevices.set(
      `${request.userId}:${request.workspaceId}:${request.vaultId}:${request.deviceId}`,
      request,
    );
  }

  async disableHighSecurity(request: EnableHighSecurityRequest): Promise<void> {
    this.highSecurityDevices.delete(
      `${request.userId}:${request.workspaceId}:${request.vaultId}:${request.deviceId}`,
    );
  }

  isHighSecurityEnabled(
    userId: string,
    workspaceId: string,
    vaultId: string,
    deviceId: string,
  ): boolean {
    return this.highSecurityDevices.has(
      `${userId}:${workspaceId}:${vaultId}:${deviceId}`,
    );
  }
}
