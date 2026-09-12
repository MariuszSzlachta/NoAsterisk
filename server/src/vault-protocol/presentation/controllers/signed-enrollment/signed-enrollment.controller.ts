import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { THROTTLE_SENSITIVE } from '@shared/presentation/throttle.constants';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { PrepareSignedEnrollmentHandler } from '@vault-protocol/application/commands/prepare-signed-enrollment';
import { FinalizeSignedEnrollmentHandler } from '@vault-protocol/application/commands/finalize-signed-enrollment';
import { ConfirmSignedEnrollmentHandler } from '@vault-protocol/application/commands/confirm-signed-enrollment';
import { mapSignedEnrollmentToPreparation } from '@vault-protocol/application/mappers/map-signed-enrollment-preparation';
import { prepareSignedEnrollmentSchema } from '@vault-protocol/presentation/dto/signed-enrollment/prepare-schema';
import { finalizeSignedEnrollmentSchema } from '@vault-protocol/presentation/dto/signed-enrollment/finalize-schema';
import { confirmSignedEnrollmentSchema } from '@vault-protocol/presentation/dto/signed-enrollment/confirm-schema';
import type {
  PrepareSignedEnrollmentDto,
  FinalizeSignedEnrollmentDto,
  ConfirmSignedEnrollmentDto,
  PrepareSignedEnrollmentResponseDto,
} from '@vault-protocol/presentation/dto/signed-enrollment/types';

@Controller('users/me/vault/enrollment/v2')
export class SignedEnrollmentController {
  constructor(
    private readonly prepareHandler: PrepareSignedEnrollmentHandler,
    private readonly finalizeHandler: FinalizeSignedEnrollmentHandler,
    private readonly confirmHandler: ConfirmSignedEnrollmentHandler,
  ) {}

  @Post('prepare')
  @Throttle(THROTTLE_SENSITIVE)
  async prepare(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(prepareSignedEnrollmentSchema))
    dto: PrepareSignedEnrollmentDto,
  ): Promise<PrepareSignedEnrollmentResponseDto> {
    return mapSignedEnrollmentToPreparation(
      await this.prepareHandler.execute({
        user,
        recoveryConfirmed: dto.recoveryConfirmed,
        intent: { ...dto.intent },
      }),
    );
  }
  @Post('finalize')
  @Throttle(THROTTLE_SENSITIVE)
  async finalize(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(finalizeSignedEnrollmentSchema))
    dto: FinalizeSignedEnrollmentDto,
  ): Promise<void> {
    await this.finalizeHandler.execute({ user, request: { ...dto } });
  }
  @Post('confirm')
  @Throttle(THROTTLE_SENSITIVE)
  async confirm(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(confirmSignedEnrollmentSchema))
    dto: ConfirmSignedEnrollmentDto,
  ): Promise<void> {
    await this.confirmHandler.execute({ user, request: { ...dto } });
  }
}
