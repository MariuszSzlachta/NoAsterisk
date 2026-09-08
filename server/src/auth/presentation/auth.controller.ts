import {
  Controller,
  Post,
  Body,
  Headers,
  UsePipes,
  HttpCode,
  HttpStatus,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { RegisterHandler } from '@auth/application/commands/register.handler';
import { LoginHandler } from '@auth/application/commands/login.handler';
import {
  RefreshHandler,
  RefreshResult,
} from '@auth/application/commands/refresh.handler';
import { AuthResult } from '@auth/application/dto/auth-result.dto';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  RegisterDto,
  LoginDto,
  RefreshDto,
} from '@auth/presentation/auth.dto';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import {
  THROTTLE_AUTH,
  THROTTLE_REFRESH,
} from '@shared/presentation/throttle.constants';
import { Public } from '@auth/presentation/decorators/public.decorator';
import { refreshTokenCookie } from '@auth/presentation/refresh-token-cookie';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerHandler: RegisterHandler,
    private readonly loginHandler: LoginHandler,
    private readonly refreshHandler: RefreshHandler,
  ) {}

  @Public()
  @Post('register')
  @Throttle(THROTTLE_AUTH)
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResult, 'refreshToken'>> {
    const result = await this.registerHandler.execute(dto);
    refreshTokenCookie.set(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('login')
  @Throttle(THROTTLE_AUTH)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResult, 'refreshToken'>> {
    const result = await this.loginHandler.execute(dto);
    refreshTokenCookie.set(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('refresh')
  @Throttle(THROTTLE_REFRESH)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refreshSchema))
  async refresh(
    @Headers('cookie') cookieHeader: string | undefined,
    @Body() _dto: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Pick<RefreshResult, 'accessToken'>> {
    const refreshToken = refreshTokenCookie.read(cookieHeader);
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const result = await this.refreshHandler.execute(refreshToken);
    refreshTokenCookie.set(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }
}
