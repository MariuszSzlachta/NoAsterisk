import {
  Controller,
  GoneException,
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@auth/presentation/decorators/current-user.decorator';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { THROTTLE_SENSITIVE } from '@shared/presentation/throttle.constants';
import {
  ChangePasswordHandler,
  ChangePasswordResult,
} from '@user-settings/application/commands/change-password.handler';
import {
  UpdateProfileHandler,
  UpdateProfileResult,
} from '@user-settings/application/commands/update-profile.handler';
import {
  UpdatePreferencesHandler,
  UpdatePreferencesResult,
} from '@user-settings/application/commands/update-preferences.handler';
import { UploadVaultHandler } from '@user-settings/application/commands/upload-vault.handler';
import { UploadVaultResult } from '@user-settings/application/commands/upload-vault.result';
import { DeleteAccountHandler } from '@user-settings/application/commands/delete-account.handler';
import {
  LogoutHandler,
  LogoutResult,
} from '@user-settings/application/commands/logout.handler';
import { GetProfileHandler } from '@user-settings/application/queries/get-profile.handler';
import { ProfileResponseDto } from '@user-settings/application/mappers/profile-response.mapper';
import { GetVaultHandler } from '@user-settings/application/queries/get-vault.handler';
import { VaultResult } from '@user-settings/application/queries/vault-result';
import {
  changePasswordSchema,
  ChangePasswordDto,
} from '@user-settings/presentation/dto/change-password.dto';
import {
  updateProfileSchema,
  UpdateProfileDto,
} from '@user-settings/presentation/dto/update-profile.dto';
import { uploadVaultSchema } from '@user-settings/presentation/dto/upload-vault.dto';
import { z } from 'zod';
import {
  deleteAccountSchema,
  DeleteAccountDto,
} from '@user-settings/presentation/dto/delete-account.dto';
import {
  updatePreferencesSchema,
  UpdatePreferencesDto,
} from '@user-settings/presentation/dto/update-preferences.dto';
import { refreshTokenCookie } from '@auth/presentation/refresh-token-cookie';

type UploadVaultDto = z.infer<typeof uploadVaultSchema>;

@Controller('users/me')
export class UserSettingsController {
  constructor(
    @Inject(ChangePasswordHandler)
    private readonly changePasswordHandler: Pick<
      ChangePasswordHandler,
      'execute'
    >,
    @Inject(UpdateProfileHandler)
    private readonly updateProfileHandler: Pick<
      UpdateProfileHandler,
      'execute'
    >,
    @Inject(UpdatePreferencesHandler)
    private readonly updatePreferencesHandler: Pick<
      UpdatePreferencesHandler,
      'execute'
    >,
    @Inject(UploadVaultHandler)
    private readonly uploadVaultHandler: Pick<UploadVaultHandler, 'execute'>,
    @Inject(DeleteAccountHandler)
    private readonly deleteAccountHandler: Pick<
      DeleteAccountHandler,
      'execute'
    >,
    @Inject(LogoutHandler)
    private readonly logoutHandler: Pick<LogoutHandler, 'execute'>,
    @Inject(GetProfileHandler)
    private readonly getProfileHandler: Pick<GetProfileHandler, 'execute'>,
    @Inject(GetVaultHandler)
    private readonly getVaultHandler: Pick<GetVaultHandler, 'execute'>,
  ) {}

  @Get()
  async getProfile(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ProfileResponseDto> {
    return this.getProfileHandler.execute({ userId: user.userId });
  }

  @Patch()
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ): Promise<UpdateProfileResult> {
    return this.updateProfileHandler.execute({
      userId: user.userId,
      displayName: dto.displayName,
    });
  }

  @Patch('preferences')
  async updatePreferences(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(updatePreferencesSchema))
    dto: UpdatePreferencesDto,
  ): Promise<UpdatePreferencesResult> {
    return this.updatePreferencesHandler.execute({
      userId: user.userId,
      preferences: dto,
    });
  }

  @Post('change-password')
  @Throttle(THROTTLE_SENSITIVE)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordDto,
  ): Promise<ChangePasswordResult> {
    return this.changePasswordHandler.execute({
      userId: user.userId,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }

  @Put('vault')
  async uploadVault(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(uploadVaultSchema)) dto: UploadVaultDto,
  ): Promise<UploadVaultResult> {
    void user;
    void dto;
    void this.uploadVaultHandler;
    throw new GoneException('Vault protocol v1 sync is disabled');
  }

  @Get('vault')
  async getVault(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<VaultResult> {
    void user;
    void this.getVaultHandler;
    throw new GoneException('Vault protocol v1 sync is disabled');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResult> {
    const result = await this.logoutHandler.execute({ userId: user.userId });
    refreshTokenCookie.clear(res);
    return result;
  }

  @Delete()
  @Throttle(THROTTLE_SENSITIVE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(deleteAccountSchema)) dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.deleteAccountHandler.execute({
      userId: user.userId,
      workspaceId: user.workspaceId,
      password: dto.password,
    });
    refreshTokenCookie.clear(res);
  }
}
