import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import { THROTTLE_SENSITIVE } from '@shared/presentation/throttle.constants';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { ConfirmRecoveryRegistrationHandler } from '@vault-protocol/application/commands/confirm-recovery-registration';
import { PrepareRecoveryRegistrationHandler } from '@vault-protocol/application/commands/prepare-recovery-registration';
import { mapRecoveryRegistrationToResponse } from '@vault-protocol/application/mappers/map-recovery-registration-response';
import { confirmRecoveryRegistrationSchema } from '@vault-protocol/presentation/dto/recovery-registration/confirm-schema';
import { prepareRecoveryRegistrationSchema } from '@vault-protocol/presentation/dto/recovery-registration/prepare-schema';
import type {
  ConfirmRecoveryRegistrationDto,
  PrepareRecoveryRegistrationDto,
  RecoveryRegistrationResponseDto,
} from '@vault-protocol/presentation/dto/recovery-registration/types';

@Controller('users/me/vault/recovery-authority')
export class RecoveryRegistrationController {
  constructor(
    private readonly prepareHandler: PrepareRecoveryRegistrationHandler,
    private readonly confirmHandler: ConfirmRecoveryRegistrationHandler,
  ) {}

  @Post('prepare')
  @Throttle(THROTTLE_SENSITIVE)
  async prepare(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(prepareRecoveryRegistrationSchema))
    dto: PrepareRecoveryRegistrationDto,
  ): Promise<RecoveryRegistrationResponseDto> {
    const registration = await this.prepareHandler.execute({
      user,
      vaultId: dto.vaultId,
      keyId: dto.keyId,
      deviceId: dto.deviceId,
      recoveryPublicKey: dto.recoveryPublicKey,
    });
    return mapRecoveryRegistrationToResponse(registration);
  }

  @Post('confirm')
  @Throttle(THROTTLE_SENSITIVE)
  async confirm(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(confirmRecoveryRegistrationSchema))
    dto: ConfirmRecoveryRegistrationDto,
  ): Promise<void> {
    await this.confirmHandler.execute({
      user,
      vaultId: dto.vaultId,
      keyId: dto.keyId,
      deviceId: dto.deviceId,
      challenge: dto.challenge,
      deviceSignature: dto.deviceSignature,
      recoverySignature: dto.recoverySignature,
    });
  }
}
