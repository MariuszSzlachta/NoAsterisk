import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '@auth/domain/ports/user.repository';
import { PASSWORD_HASHER, PasswordHasherPort } from '@auth/domain/ports/password-hasher.port';
import { TOKEN_PORT, TokenPort } from '@auth/domain/ports/token.port';
import { WORKSPACE_REPOSITORY, WorkspaceRepository } from '@workspaces/domain/ports/workspace.repository';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';
import { Workspace } from '@workspaces/domain/workspace.entity';
import { DomainError } from '@shared/domain/domain.error';
import { AuthResult } from '@auth/application/dto/auth-result.dto';

export interface RegisterCommand {
  email: string;
  password: string;
}

@Injectable()
export class RegisterHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_PORT) private readonly token: TokenPort,
    @Inject(WORKSPACE_REPOSITORY) private readonly workspaceRepo: WorkspaceRepository,
  ) {}

  async execute(command: RegisterCommand): Promise<AuthResult> {
    const exists = await this.userRepo.existsByEmail(command.email);
    if (exists) {
      throw new DomainError('Email already registered');
    }

    const workspace = Workspace.create({ name: `${command.email}'s workspace` });
    await this.workspaceRepo.save(workspace);

    const passwordHash = await this.hasher.hash(command.password);

    const user = User.create({
      email: command.email,
      passwordHash,
      role: UserRole.Member,
      workspaceId: workspace.id,
    });

    await this.userRepo.save(user);

    const tokenPayload = { sub: user.id, workspaceId: user.workspaceId, role: user.role };
    const accessToken = this.token.sign(tokenPayload);
    const refreshToken = this.token.signRefresh(tokenPayload);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, workspaceId: user.workspaceId },
    };
  }
}
