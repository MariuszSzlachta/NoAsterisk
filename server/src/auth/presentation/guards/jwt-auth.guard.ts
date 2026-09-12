import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TOKEN_PORT, TokenPort } from '@auth/domain/ports/token.port';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';
import { UserRole } from '@auth/domain/user-role.enum';
import { IS_PUBLIC_KEY } from '@auth/presentation/decorators/public.decorator';
import { CurrentUserPayload } from '@auth/presentation/decorators/current-user.decorator';
import { isTokenPayload } from '@auth/domain/ports/token-payload.guard';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_PORT) private readonly token: TokenPort,
    private readonly reflector: Reflector,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: CurrentUserPayload;
    }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const jwt = authHeader.slice(7);
    const payload = this.token.verify(jwt);

    if (!isTokenPayload(payload)) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const tokenVersion: unknown = payload.tokenVersion;
    if (
      typeof tokenVersion !== 'number' ||
      !Number.isSafeInteger(tokenVersion)
    ) {
      throw new UnauthorizedException('Token is missing revocation version');
    }

    const user = await this.userRepo.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (user.role === UserRole.Blocked) {
      throw new UnauthorizedException('Account is blocked');
    }

    if (tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException('Token has been revoked');
    }

    request.user = {
      userId: user.id,
      workspaceId: user.workspaceId,
      role: user.role,
      authTime: payload.authTime,
      amr: payload.amr,
      vaultUnlockGrant: payload.vaultUnlockGrant,
    };

    return true;
  }
}
