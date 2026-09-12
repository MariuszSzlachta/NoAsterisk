import { Injectable } from '@nestjs/common';
import type {
  VaultDeviceRepository,
  VaultDeviceSummary,
} from '@vault-protocol/domain/ports/vault-device.repository';

@Injectable()
export class InMemoryVaultDeviceRepository implements VaultDeviceRepository {
  private readonly devices = new Map<string, VaultDeviceSummary>();

  async list(
    _userId: string,
    _workspaceId: string,
  ): Promise<ReadonlyArray<VaultDeviceSummary>> {
    return [...this.devices.values()];
  }

  async revoke(
    _userId: string,
    _workspaceId: string,
    deviceId: string,
  ): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device === undefined) return;
    this.devices.set(deviceId, {
      ...device,
      status: 'revoked',
      revokedAt: new Date().toISOString(),
    });
  }

  seed(device: VaultDeviceSummary): void {
    this.devices.set(device.deviceId, device);
  }
}
