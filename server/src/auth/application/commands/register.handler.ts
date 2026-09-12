import { Injectable, Inject } from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '@auth/domain/ports/password-hasher.port';
import {
  TOKEN_PORT,
  TokenPayload,
  TokenPort,
} from '@auth/domain/ports/token.port';
import {
  PERMISSION_REPOSITORY,
  PermissionRepository,
} from '@auth/domain/ports/permission.repository';
import {
  WORKSPACE_REPOSITORY,
  WorkspaceRepository,
} from '@workspaces/domain/ports/workspace.repository';
import {
  INVITE_CODE_REPOSITORY,
  InviteCodeRepository,
} from '@invite-codes/domain/ports/invite-code.repository';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';
import { Permission } from '@auth/domain/permission.entity';
import { Workspace } from '@workspaces/domain/workspace.entity';
import { DomainError } from '@budget/domain';
import { AuthResult } from '@auth/application/dto/auth-result.dto';
import { validateRegistrationConsent } from '@auth/application/consent/validate-registration-consent';
import { registrationInvite } from '@auth/application/consent/registration-invite';

export const REGISTRATION_MODE = Symbol('REGISTRATION_MODE');

export interface RegisterCommand {
  email: string;
  password: string;
  inviteCode?: string;
  privacyPolicyVersion: string;
  termsVersion: string;
}

@Injectable()
export class RegisterHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_PORT) private readonly token: TokenPort,
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepo: WorkspaceRepository,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepo: PermissionRepository,
    @Inject(INVITE_CODE_REPOSITORY)
    private readonly inviteCodeRepo: InviteCodeRepository,
    @Inject(REGISTRATION_MODE)
    private readonly registrationMode: string,
  ) {}

  async execute(command: RegisterCommand): Promise<AuthResult> {
    validateRegistrationConsent(
      command.privacyPolicyVersion,
      command.termsVersion,
    );
    if (this.registrationMode === 'invite-only') {
      if (!command.inviteCode) {
        throw new DomainError('Invite code is required');
      }
    }

    // Claim invite code BEFORE user creation to prevent race conditions.
    // If user creation fails after code is claimed, the code is consumed (acceptable).
    // ARCH-EXCEPTION: Postgres impl should wrap the full flow in a transaction
    // for consistency. In-memory mode is single-threaded, no race possible.
    let claimedCodeId: string | undefined;
    if (command.inviteCode) {
      claimedCodeId = await registrationInvite.claim(
        command.inviteCode,
        this.inviteCodeRepo,
      );
    }

    const exists = await this.userRepo.existsByEmail(command.email);
    if (exists) {
      throw new DomainError('Registration failed');
    }

    const workspace = Workspace.create({
      name: `${command.email}'s workspace`,
    });
    await this.workspaceRepo.save(workspace);

    const passwordHash = await this.hasher.hash(command.password);

    const user = User.create({
      email: command.email,
      passwordHash,
      role: UserRole.Member,
      workspaceId: workspace.id,
      privacyPolicyVersion: command.privacyPolicyVersion,
      termsVersion: command.termsVersion,
      consentAt: new Date(),
    });

    await this.userRepo.save(user);

    // Update code with userId after user is created
    if (claimedCodeId) {
      await registrationInvite.assign(
        claimedCodeId,
        user.id,
        this.inviteCodeRepo,
      );
    }

    const permission = Permission.create({
      userId: user.id,
      resourceType: 'workspace',
      resourceId: workspace.id,
      actions: ['read', 'write', 'delete', 'admin'],
    });
    await this.permissionRepo.save(permission);

    const tokenPayload: TokenPayload = {
      sub: user.id,
      workspaceId: user.workspaceId,
      role: user.role,
      tokenVersion: user.tokenVersion,
      authTime: Date.now(),
      amr: 'password',
    };
    const accessToken = this.token.sign(tokenPayload);
    const refreshToken = this.token.signRefresh(tokenPayload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
      },
    };
  }
}
