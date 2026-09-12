import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { THROTTLE_SENSITIVE } from '@shared/presentation/throttle.constants';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { IssueServerShareHandler } from '@vault-protocol/application/issue-server-share.handler';
import { RotateVaultHandler } from '@vault-protocol/application/rotate-vault.handler';
import { z } from 'zod';

const issueServerShareSchema = z
  .object({
    deviceId: z.string().min(1).max(128),
  })
  .strict();
type IssueServerShareDto = z.infer<typeof issueServerShareSchema>;

const rotateVaultSchema = z
  .object({
    vaultId: z.string().min(1).max(128),
    deviceId: z.string().min(1).max(128),
    currentKeyId: z.string().min(1).max(128),
    nextKeyId: z.string().min(1).max(128),
    envelopePurpose: z.enum(['device-wrap', 'passkey-wrap']),
    envelope: z
      .string()
      .min(1)
      .max(128 * 1024),
    passkeyEnvelope: z
      .string()
      .min(1)
      .max(128 * 1024)
      .optional(),
    recoveryConfirmed: z.literal(true),
    idempotencyKey: z.string().min(1).max(128),
  })
  .strict();
type RotateVaultDto = z.infer<typeof rotateVaultSchema>;

interface VaultServerShareResponse {
  readonly serverShare: string;
  readonly expiresAt: string;
}

@Controller('users/me/vault')
export class VaultProtocolController {
  constructor(
    private readonly issueServerShare: IssueServerShareHandler,
    private readonly rotateVault: RotateVaultHandler,
  ) {}

  @Post('server-share')
  @Throttle(THROTTLE_SENSITIVE)
  async issue(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(issueServerShareSchema))
    dto: IssueServerShareDto,
  ): Promise<VaultServerShareResponse> {
    return this.issueServerShare.execute({ user, deviceId: dto.deviceId });
  }

  @Post('rotate')
  @Throttle(THROTTLE_SENSITIVE)
  async rotate(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(rotateVaultSchema)) dto: RotateVaultDto,
  ) {
    return this.rotateVault.execute({ user, ...dto });
  }
}
