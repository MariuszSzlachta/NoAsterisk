import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '@auth/presentation/auth.controller';
import {
  RegisterHandler,
  REGISTRATION_MODE,
} from '@auth/application/commands/register.handler';
import { LoginHandler } from '@auth/application/commands/login.handler';
import { RefreshHandler } from '@auth/application/commands/refresh.handler';
import { USER_REPOSITORY } from '@auth/domain/ports/user.repository';
import { PASSWORD_HASHER } from '@auth/domain/ports/password-hasher.port';
import { TOKEN_PORT } from '@auth/domain/ports/token.port';
import { PERMISSION_REPOSITORY } from '@auth/domain/ports/permission.repository';
import { WorkspacesModule } from '@workspaces/workspaces.module';
import { InviteCodesModule } from '@invite-codes/invite-codes.module';
import { InMemoryUserRepository } from '@auth/infrastructure/in-memory-user.repository';
import { InMemoryPermissionRepository } from '@auth/infrastructure/in-memory-permission.repository';
import { PostgresUserRepository } from '@auth/infrastructure/postgres-user.repository';
import { PostgresPermissionRepository } from '@auth/infrastructure/postgres-permission.repository';
import { BcryptPasswordHasher } from '@auth/infrastructure/bcrypt-password-hasher.adapter';
import { JwtTokenAdapter } from '@auth/infrastructure/jwt-token.adapter';
import { JwtAuthGuard } from '@auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/presentation/guards/roles.guard';
import { PermissionGuard } from '@auth/presentation/guards/permission.guard';
import { createRepositoryProvider } from '@shared/infrastructure/database/persistence.provider';

// ARCH-EXCEPTION: ABAC enforcement deferred — single-user workspace in MVP.
// Permission entity is created at registration (full workspace access).
// When multi-user workspace feature lands (member invite), activate PermissionGuard
// on resource-specific endpoints. Currently, workspace isolation is enforced via
// workspaceId from JWT claims (see Tier 1 security fix 2026-08-20).
// Planned resolution: Phase 5 — Admin/Maintenance (multi-user + granular permissions)
// Accepted without ticket — tracked in docs/plans/deferred/phase-5-admin-maintenance.md
@Module({
  imports: [
    WorkspacesModule,
    InviteCodesModule,
    JwtModule.register({
      secret: (() => {
        const secret = process.env['JWT_SECRET'];
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return secret;
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
    PermissionGuard,
    createRepositoryProvider(
      USER_REPOSITORY,
      PostgresUserRepository,
      InMemoryUserRepository,
    ),
    createRepositoryProvider(
      PERMISSION_REPOSITORY,
      PostgresPermissionRepository,
      InMemoryPermissionRepository,
    ),
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_PORT, useClass: JwtTokenAdapter },
    {
      provide: REGISTRATION_MODE,
      useValue: process.env['REGISTRATION_MODE'] ?? 'invite-only',
    },
  ],
  exports: [
    USER_REPOSITORY,
    PASSWORD_HASHER,
    TOKEN_PORT,
    PERMISSION_REPOSITORY,
    JwtAuthGuard,
    RolesGuard,
    PermissionGuard,
  ],
})
export class AuthModule {}
