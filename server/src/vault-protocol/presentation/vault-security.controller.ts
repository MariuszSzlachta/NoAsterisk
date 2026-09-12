import { Body, Controller, Inject, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { THROTTLE_SENSITIVE } from '@shared/presentation/throttle.constants';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { EnableHighSecurityHandler } from '@vault-protocol/application/enable-high-security.handler';
import { z } from 'zod';

const enableSchema = z
  .object({
    vaultId: z.string().min(1).max(128),
    keyId: z.string().min(1).max(128),
    deviceId: z.string().min(1).max(128),
    passkeyEnvelope: z.string().min(2).max(20_000),
    recoveryConfirmed: z.literal(true),
  })
  .strict();
type EnableDto = z.infer<typeof enableSchema>;
const disableSchema = z
  .object({
    vaultId: z.string().min(1).max(128),
    keyId: z.string().min(1).max(128),
    deviceId: z.string().min(1).max(128),
    deviceEnvelope: z.string().min(2).max(20_000),
    recoveryConfirmed: z.literal(true),
  })
  .strict();
type DisableDto = z.infer<typeof disableSchema>;

@Controller('users/me/vault/security')
export class VaultSecurityController {
  constructor(
    @Inject(EnableHighSecurityHandler)
    private readonly enableHighSecurity: EnableHighSecurityHandler,
  ) {}

  @Post('high-security/enable')
  @Throttle(THROTTLE_SENSITIVE)
  async enable(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(enableSchema)) dto: EnableDto,
  ): Promise<{ readonly status: 'enabled' }> {
    await this.enableHighSecurity.execute({ user, ...dto });
    return { status: 'enabled' };
  }

  @Post('passkey/enable')
  @Throttle(THROTTLE_SENSITIVE)
  async enablePasskey(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(enableSchema)) dto: EnableDto,
  ): Promise<{ readonly status: 'enabled' }> {
    await this.enableHighSecurity.enablePasskeyUnlock({ user, ...dto });
    return { status: 'enabled' };
  }

  @Post('high-security/disable')
  @Throttle(THROTTLE_SENSITIVE)
  async disable(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(disableSchema)) dto: DisableDto,
  ): Promise<{ readonly status: 'disabled' }> {
    await this.enableHighSecurity.disable({
      user,
      vaultId: dto.vaultId,
      keyId: dto.keyId,
      deviceId: dto.deviceId,
      passkeyEnvelope: dto.deviceEnvelope,
      recoveryConfirmed: dto.recoveryConfirmed,
    });
    return { status: 'disabled' };
  }
}
