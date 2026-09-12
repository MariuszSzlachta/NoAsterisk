import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { THROTTLE_SENSITIVE } from '@shared/presentation/throttle.constants';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { WebauthnCredentialHandler } from '@vault-protocol/application/webauthn-credential.handler';
import { z } from 'zod';

const contextSchema = z
  .object({
    vaultId: z.string().min(1).max(128),
    deviceId: z.string().min(1).max(128),
  })
  .strict();
const registrationSchema = contextSchema
  .extend({
    challenge: z.string().min(16).max(128),
    credential: z
      .object({
        id: z.string().min(1).max(1024),
        rawId: z.string().min(1).max(16_384),
        type: z.literal('public-key'),
        response: z
          .object({
            clientDataJSON: z.string().min(1).max(16_384),
            attestationObject: z.string().min(1).max(16_384),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();
const authenticationSchema = contextSchema
  .extend({
    challenge: z.string().min(16).max(128),
    assertion: z
      .object({
        id: z.string().min(1).max(1024),
        rawId: z.string().min(1).max(16_384),
        type: z.literal('public-key'),
        response: z
          .object({
            clientDataJSON: z.string().min(1).max(16_384),
            authenticatorData: z.string().min(1).max(16_384),
            signature: z.string().min(1).max(16_384),
            userHandle: z.string().max(16_384).optional(),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();
type ContextDto = z.infer<typeof contextSchema>;
type RegistrationDto = z.infer<typeof registrationSchema>;
type AuthenticationDto = z.infer<typeof authenticationSchema>;

@Controller('users/me/vault/webauthn/credentials')
export class WebauthnCredentialController {
  constructor(private readonly handler: WebauthnCredentialHandler) {}

  @Post('registration/options')
  @Throttle(THROTTLE_SENSITIVE)
  createOptions(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(contextSchema)) dto: ContextDto,
  ) {
    return this.handler.createRegistrationOptions(user, dto);
  }

  @Post('registration/verify')
  @Throttle(THROTTLE_SENSITIVE)
  async verify(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(registrationSchema)) dto: RegistrationDto,
  ): Promise<{ readonly status: 'registered' }> {
    await this.handler.verifyRegistration(user, {
      ...dto,
      credential: {
        ...dto.credential,
        response: dto.credential.response,
        clientExtensionResults: {},
      },
    });
    return { status: 'registered' };
  }

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.handler.list(user);
  }

  @Post('authentication/verify')
  @Throttle(THROTTLE_SENSITIVE)
  async verifyAuthentication(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(authenticationSchema)) dto: AuthenticationDto,
  ): Promise<{ readonly status: 'verified'; readonly accessToken: string }> {
    const result = await this.handler.verifyAuthentication(user, dto);
    return { status: 'verified', ...result };
  }

  @Delete(':credentialId')
  @Throttle(THROTTLE_SENSITIVE)
  async revoke(
    @CurrentUser() user: CurrentUserPayload,
    @Param('credentialId') credentialId: string,
  ): Promise<{ readonly status: 'revoked' }> {
    if (credentialId.length === 0 || credentialId.length > 1024)
      throw new Error('Invalid credential');
    await this.handler.revoke(user, credentialId);
    return { status: 'revoked' };
  }
}
