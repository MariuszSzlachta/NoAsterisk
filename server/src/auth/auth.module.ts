import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '@auth/presentation/auth.controller';
import { RegisterHandler } from '@auth/application/commands/register.handler';
import { LoginHandler } from '@auth/application/commands/login.handler';
import { RefreshHandler } from '@auth/application/commands/refresh.handler';
import { USER_REPOSITORY } from '@auth/domain/ports/user.repository';
import { PASSWORD_HASHER } from '@auth/domain/ports/password-hasher.port';
import { TOKEN_PORT } from '@auth/domain/ports/token.port';
import { PERMISSION_REPOSITORY } from '@auth/domain/ports/permission.repository';
import { WorkspacesModule } from '@workspaces/workspaces.module';
import { InMemoryUserRepository } from '@auth/infrastructure/in-memory-user.repository';
import { InMemoryPermissionRepository } from '@auth/infrastructure/in-memory-permission.repository';
import { BcryptPasswordHasher } from '@auth/infrastructure/bcrypt-password-hasher.adapter';
import { JwtTokenAdapter } from '@auth/infrastructure/jwt-token.adapter';
import { JwtAuthGuard } from '@auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/presentation/guards/roles.guard';

@Module({
  imports: [
    WorkspacesModule,
    JwtModule.register({
      secret: (() => {
        const secret = process.env['JWT_SECRET'];
        if (!secret && process.env['NODE_ENV'] === 'production') {
          throw new Error(
            'JWT_SECRET environment variable is required in production',
          );
        }
        return secret ?? 'dev-secret-unsafe';
      })(),
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterHandler,
    LoginHandler,
    RefreshHandler,
    JwtAuthGuard,
    RolesGuard,
    { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
    { provide: PERMISSION_REPOSITORY, useClass: InMemoryPermissionRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_PORT, useClass: JwtTokenAdapter },
  ],
  exports: [
    USER_REPOSITORY,
    TOKEN_PORT,
    PERMISSION_REPOSITORY,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
