import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { SyncSnapshotHandler } from '@vault-protocol/application/sync-snapshot.handler';
import { syncSnapshotSchema } from '@vault-protocol/application/sync-snapshot.contract';
import type { z } from 'zod';

type SyncSnapshotDto = z.infer<typeof syncSnapshotSchema>;

@Controller('users/me/vault/sync')
export class SyncSnapshotController {
  constructor(private readonly handler: SyncSnapshotHandler) {}

  @Get(':vaultId')
  get(
    @CurrentUser() user: CurrentUserPayload,
    @Param('vaultId') vaultId: string,
  ) {
    return this.handler.get(user.userId, user.workspaceId, vaultId);
  }

  @Put(':vaultId')
  put(
    @CurrentUser() user: CurrentUserPayload,
    @Param('vaultId') vaultId: string,
    @Headers('if-match') expectedRevisionHeader: string | undefined,
    @Body(new ZodValidationPipe(syncSnapshotSchema)) dto: SyncSnapshotDto,
  ) {
    if (dto.vaultId !== vaultId)
      throw new BadRequestException('Vault context mismatch');
    const expectedRevision = Number(expectedRevisionHeader ?? '0');
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
      throw new BadRequestException('Invalid sync revision');
    return this.handler.put(
      user.userId,
      user.workspaceId,
      dto,
      expectedRevision,
    );
  }
}
