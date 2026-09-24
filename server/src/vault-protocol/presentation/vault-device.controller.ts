import { Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { THROTTLE_SENSITIVE } from '@shared/presentation/throttle.constants';
import { VaultDeviceHandler } from '@vault-protocol/application/vault-device.handler';

@Controller('users/me/vault/devices')
export class VaultDeviceController {
  constructor(
    @Inject(VaultDeviceHandler)
    private readonly handler: Pick<VaultDeviceHandler, 'list' | 'revoke'>,
  ) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.handler.list(user);
  }

  @Post(':deviceId/revoke')
  @Throttle(THROTTLE_SENSITIVE)
  async revoke(
    @CurrentUser() user: CurrentUserPayload,
    @Param('deviceId') deviceId: string,
  ): Promise<{ readonly status: 'revoked' }> {
    await this.handler.revoke(user, deviceId);
    return { status: 'revoked' };
  }
}
