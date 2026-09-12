import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { GetVaultBootstrapHandler } from '@vault-protocol/application/get-vault-bootstrap.handler';

@Controller('users/me/vault')
export class VaultBootstrapController {
  constructor(private readonly handler: GetVaultBootstrapHandler) {}

  @Get('bootstrap')
  get(
    @CurrentUser() user: CurrentUserPayload,
    @Query('deviceId') deviceId?: string,
  ) {
    if (deviceId === undefined || deviceId.length === 0)
      throw new BadRequestException('Device ID is required');
    return this.handler.execute(user.userId, user.workspaceId, deviceId);
  }
}
