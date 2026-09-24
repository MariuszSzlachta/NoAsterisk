import { prepareRotationSchema } from '@vault-protocol/presentation/dto/dual-root-rotation/prepareRotationSchema';
import { finalizeRotationSchema } from '@vault-protocol/presentation/dto/dual-root-rotation/finalizeRotationSchema';
import { mapFinalizeRotationDtoToCommand } from '@vault-protocol/presentation/dto/dual-root-rotation/mapFinalizeRotationDtoToCommand';
import type {
  PrepareRotationDto,
  FinalizeRotationDto,
} from '@vault-protocol/presentation/dto/dual-root-rotation/types';
import { mapRotationTranscriptToResponse } from '@vault-protocol/application/mappers/mapRotationTranscriptToResponse';
import type { RotationTranscriptResponse } from '@vault-protocol/application/mappers/mapRotationTranscriptToResponse/types';
import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import { THROTTLE_SENSITIVE } from '@shared/presentation/throttle.constants';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { PrepareDualRootRotationHandler } from '@vault-protocol/application/commands/prepare-dual-root-rotation';
import { FinalizeDualRootRotationHandler } from '@vault-protocol/application/commands/finalize-dual-root-rotation';

@Controller('users/me/vault/rotate')
export class DualRootRotationController {
  constructor(
    private readonly prepareHandler: PrepareDualRootRotationHandler,
    private readonly finalizeHandler: FinalizeDualRootRotationHandler,
  ) {}

  @Post('prepare')
  @Throttle(THROTTLE_SENSITIVE)
  async prepare(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(prepareRotationSchema)) dto: PrepareRotationDto,
  ): Promise<RotationTranscriptResponse> {
    const transcript = await this.prepareHandler.execute({ user, ...dto });
    return mapRotationTranscriptToResponse(transcript);
  }

  @Post('finalize')
  @Throttle(THROTTLE_SENSITIVE)
  async finalize(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(finalizeRotationSchema))
    dto: FinalizeRotationDto,
  ): Promise<void> {
    await this.finalizeHandler.execute(
      mapFinalizeRotationDtoToCommand(user, dto),
    );
  }
}
