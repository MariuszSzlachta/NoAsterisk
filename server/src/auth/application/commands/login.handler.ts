import { Injectable, Inject } from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '@auth/domain/ports/password-hasher.port';
import { TOKEN_PORT, TokenPort } from '@auth/domain/ports/token.port';
import { DomainError } from '@budget/domain';
import { UserRole } from '@auth/domain/user-role.enum';
import { AuthResult } from '@auth/application/dto/auth-result.dto';

export interface LoginCommand {
  email: string;
  password: string;
}

@Injectable()
export class LoginHandler {
  // Pre-computed bcrypt hash used for constant-time comparison when user doesn't exist.
  // Prevents timing-based user enumeration (SEC-BE-002).
  private static readonly DUMMY_HASH =
    '$2b$10$K4GwICEqaFpOVsdmVmSzbe1Y9MQm1UzFbCf3F/bHmAw/PD.m8V9Gm';

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_PORT) private readonly token: TokenPort,
  ) {}

  async execute(command: LoginCommand): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(command.email);
    if (!user) {
      await this.hasher.compare(command.password, LoginHandler.DUMMY_HASH);
      throw new DomainError('Invalid credentials');
    }

    const isValid = await this.hasher.compare(
      command.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new DomainError('Invalid credentials');
    }

    if (user.role === UserRole.Blocked) {
      throw new DomainError('Invalid credentials');
    }

    const tokenPayload = {
      sub: user.id,
      workspaceId: user.workspaceId,
      role: user.role,
      tokenVersion: user.tokenVersion,
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
