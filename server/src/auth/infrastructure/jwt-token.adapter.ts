import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenPort, TokenPayload } from '@auth/domain/ports/token.port';

@Injectable()
export class JwtTokenAdapter implements TokenPort {
  private static readonly REFRESH_SECRET_SUFFIX = '-refresh';

  constructor(private readonly jwtService: JwtService) {}

  sign(payload: TokenPayload): string {
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  signRefresh(payload: TokenPayload): string {
    const secret = this.getRefreshSecret();
    return this.jwtService.sign(payload, { secret, expiresIn: '7d' });
  }

  verify(token: string): TokenPayload | undefined {
    try {
      return this.jwtService.verify<TokenPayload>(token);
    } catch {
      return undefined;
    }
  }

  verifyRefresh(token: string): TokenPayload | undefined {
    try {
      const secret = this.getRefreshSecret();
      return this.jwtService.verify<TokenPayload>(token, { secret });
    } catch {
      return undefined;
    }
  }

  private getRefreshSecret(): string {
    const baseSecret = process.env['JWT_SECRET'] ?? 'dev-secret-unsafe';
    return baseSecret + JwtTokenAdapter.REFRESH_SECRET_SUFFIX;
  }
}
