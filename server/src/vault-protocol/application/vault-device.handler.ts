import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { assertFreshInteractiveAuth } from '@shared/auth/auth-freshness';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { VAULT_DEVICE_REPOSITORY } from '@vault-protocol/domain/ports/vault-device.token';
import type { VaultDeviceRepository } from '@vault-protocol/domain/ports/vault-device.repository';

@Injectable()
export class VaultDeviceHandler {
  constructor(
    @Inject(VAULT_DEVICE_REPOSITORY)
    private readonly repository: VaultDeviceRepository,
  ) {}

  list(user: CurrentUserPayload) {
    return this.repository.list(user.userId, user.workspaceId);
  }

  async revoke(user: CurrentUserPayload, deviceId: string): Promise<void> {
    assertFreshInteractiveAuth(user);
    if (deviceId.length === 0 || deviceId.length > 128)
      throw new ForbiddenException('Invalid device');
    await this.repository.revoke(user.userId, user.workspaceId, deviceId);
  }
}
