import { Controller, Post, Body, UsePipes, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RegisterHandler } from '@auth/application/commands/register.handler';
import { LoginHandler } from '@auth/application/commands/login.handler';
import { RefreshHandler, RefreshResult } from '@auth/application/commands/refresh.handler';
import { AuthResult } from '@auth/application/dto/auth-result.dto';
import { registerSchema, loginSchema, refreshSchema, RegisterDto, LoginDto, RefreshDto } from '@auth/presentation/auth.dto';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { THROTTLE_AUTH, THROTTLE_REFRESH } from '@shared/presentation/throttle.constants';
import { Public } from '@auth/presentation/decorators/public.decorator';

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
  async register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.registerHandler.execute(dto);
  }

  @Public()
  @Post('login')
  @Throttle(THROTTLE_AUTH)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.loginHandler.execute(dto);
  }

  @Public()
  @Post('refresh')
  @Throttle(THROTTLE_REFRESH)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refreshSchema))
  async refresh(@Body() dto: RefreshDto): Promise<RefreshResult> {
    return this.refreshHandler.execute(dto.refreshToken);
  }
}
