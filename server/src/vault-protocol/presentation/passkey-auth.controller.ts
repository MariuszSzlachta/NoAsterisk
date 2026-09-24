import {
  Body,
  Inject,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '@shared/presentation/public.decorator';
import { refreshTokenCookie } from '@shared/presentation/refresh-token-cookie';
import { THROTTLE_AUTH } from '@shared/presentation/throttle.constants';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { PasskeyLoginHandler } from '@vault-protocol/application/passkey-login.handler';
import { z } from 'zod';

const encoded = z.string().min(1).max(16_384);
const assertionSchema = z
  .object({
    id: z.string().min(1).max(512),
    rawId: encoded,
    type: z.literal('public-key'),
    response: z
      .object({
        clientDataJSON: encoded,
        authenticatorData: encoded,
        signature: encoded,
        userHandle: encoded.optional(),
      })
      .strict(),
  })
  .strict();
const optionsSchema = z
  .object({ email: z.email(), deviceId: z.string().min(1).max(128).optional() })
  .strict();
const verifySchema = z
  .object({
    email: z.email(),
    challenge: encoded,
    assertion: assertionSchema,
  })
  .strict();

type OptionsDto = z.infer<typeof optionsSchema>;
type VerifyDto = z.infer<typeof verifySchema>;

@Public()
@Controller('auth/passkey')
export class PasskeyAuthController {
  constructor(
    @Inject(PasskeyLoginHandler)
    private readonly handler: Pick<
      PasskeyLoginHandler,
      'createOptions' | 'verify'
    >,
  ) {}

  @Post('options')
  @Throttle(THROTTLE_AUTH)
  @HttpCode(HttpStatus.OK)
  options(@Body(new ZodValidationPipe(optionsSchema)) dto: OptionsDto) {
    return this.handler.createOptions(dto.email, dto.deviceId);
  }

  @Post('verify')
  @Throttle(THROTTLE_AUTH)
  @HttpCode(HttpStatus.OK)
  async verify(
    @Body(new ZodValidationPipe(verifySchema)) dto: VerifyDto,
    @Res({ passthrough: true })
    response: Pick<Response, 'cookie' | 'setHeader'>,
  ) {
    const result = await this.handler.verify(
      dto.email,
      dto.challenge,
      dto.assertion,
    );
    refreshTokenCookie.set(response, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }
}
