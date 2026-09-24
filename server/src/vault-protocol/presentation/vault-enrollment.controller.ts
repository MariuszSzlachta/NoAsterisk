import { Body, Controller, Inject, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { THROTTLE_SENSITIVE } from '@shared/presentation/throttle.constants';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { VaultEnrollmentHandler } from '@vault-protocol/application/vault-enrollment.handler';
import { z } from 'zod';

const prepareSchema = z
  .object({
    deviceId: z.string().min(1).max(128),
    vaultId: z.uuid().optional(),
    recoveryConfirmed: z.literal(true),
  })
  .strict();

const finalizeSchema = z
  .object({
    challenge: z.string().min(1).max(128),
    deviceId: z.string().min(1).max(128),
    vaultId: z.uuid(),
    keyId: z.string().min(1).max(128),
    deviceEnvelope: z.string().min(2).max(20_000),
    signingPublicKey: z.string().min(2).max(10_000),
    passkeyEnvelope: z.string().min(2).max(20_000).optional(),
    trustedDeviceProof: z.string().min(2).max(64_000).optional(),
  })
  .strict();

const confirmationSchema = z
  .object({
    challenge: z.string().min(1).max(128),
    deviceId: z.string().min(1).max(128),
    vaultId: z.uuid(),
    keyId: z.string().min(1).max(128),
  })
  .strict();

type PrepareDto = z.infer<typeof prepareSchema>;
type FinalizeDto = z.infer<typeof finalizeSchema>;
type ConfirmationDto = z.infer<typeof confirmationSchema>;

@Controller('users/me/vault/enrollment')
export class VaultEnrollmentController {
  constructor(
    @Inject(VaultEnrollmentHandler)
    private readonly handler: Pick<
      VaultEnrollmentHandler,
      'prepare' | 'finalize' | 'confirm'
    >,
  ) {}

  @Post('prepare')
  @Throttle(THROTTLE_SENSITIVE)
  prepare(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(prepareSchema)) dto: PrepareDto,
  ) {
    return this.handler.prepare({ ...dto, user });
  }

  @Post('finalize')
  @Throttle(THROTTLE_SENSITIVE)
  async finalize(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(finalizeSchema)) dto: FinalizeDto,
  ): Promise<void> {
    await this.handler.finalize(user, {
      ...dto,
      userId: user.userId,
      workspaceId: user.workspaceId,
    });
  }

  @Post('confirm')
  @Throttle(THROTTLE_SENSITIVE)
  async confirm(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(confirmationSchema)) dto: ConfirmationDto,
  ): Promise<void> {
    await this.handler.confirm(user, {
      ...dto,
      userId: user.userId,
      workspaceId: user.workspaceId,
    });
  }
}
