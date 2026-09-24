import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { THROTTLE_SENSITIVE } from '@shared/presentation/throttle.constants';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { WebauthnChallengeHandler } from '@vault-protocol/application/webauthn-challenge.handler';
import { z } from 'zod';

const challengeSchema = z
  .object({
    vaultId: z.string().min(1).max(128),
    deviceId: z.string().min(1).max(128),
    type: z.enum(['registration', 'authentication']),
  })
  .strict();

type ChallengeDto = z.infer<typeof challengeSchema>;
const REQUIRED_USER_VERIFICATION = 'required';

@Controller('users/me/vault/webauthn')
export class WebauthnChallengeController {
  constructor(
    @Inject(WebauthnChallengeHandler)
    private readonly handler: Pick<WebauthnChallengeHandler, 'create'>,
  ) {}

  @Post('challenge')
  @Throttle(THROTTLE_SENSITIVE)
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(challengeSchema)) dto: ChallengeDto,
  ) {
    try {
      const record = await this.handler.create({
        userId: user.userId,
        vaultId: dto.vaultId,
        deviceId: dto.deviceId,
        type: dto.type,
      });
      return {
        challenge: record.challenge,
        expiresAt: new Date(record.expiresAt).toISOString(),
        type: record.type,
        userVerification: REQUIRED_USER_VERIFICATION,
      };
    } catch {
      throw new BadRequestException('Unable to create WebAuthn challenge');
    }
  }
}
