import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { TOKEN_PORT, TokenPort } from '@auth/domain/ports/token.port';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshHandler {
  constructor(
    @Inject(TOKEN_PORT) private readonly token: TokenPort,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async execute(refreshToken: string): Promise<RefreshResult> {
    const payload = this.token.verifyRefresh(refreshToken);
    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (
      payload.tokenVersion !== undefined &&
      payload.tokenVersion !== user.tokenVersion
    ) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const tokenPayload = {
      sub: user.id,
      workspaceId: user.workspaceId,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    return {
      accessToken: this.token.sign(tokenPayload),
      refreshToken: this.token.signRefresh(tokenPayload),
    };
  }
}
