import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { TOKEN_PORT, TokenPort } from '@auth/domain/ports/token.port';

export interface RefreshResult {
  accessToken: string;
}

@Injectable()
export class RefreshHandler {
  constructor(@Inject(TOKEN_PORT) private readonly token: TokenPort) {}

  execute(refreshToken: string): RefreshResult {
    const payload = this.token.verifyRefresh(refreshToken);
    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = this.token.sign({
      sub: payload.sub,
      workspaceId: payload.workspaceId,
      role: payload.role,
    });

    return { accessToken };
  }
}
