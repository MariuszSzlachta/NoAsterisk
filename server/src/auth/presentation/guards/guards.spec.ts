import {
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/presentation/guards/roles.guard';
import { TokenPort } from '@auth/domain/ports/token.port';

const mockContext = (
  headers: Record<string, string>,
  user?: unknown,
): ExecutionContext => {
  const request = { headers, user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let token: jest.Mocked<TokenPort>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    token = {
      sign: jest.fn(),
      signRefresh: jest.fn(),
      verify: jest.fn(),
      verifyRefresh: jest.fn(),
    };
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Reflector>;
    guard = new JwtAuthGuard(token, reflector);
  });

  it('passes and sets user for valid token', () => {
    token.verify.mockReturnValue({
      sub: 'user-1',
      workspaceId: 'ws-1',
      role: 'Member',
    });
    const ctx = mockContext({ authorization: 'Bearer valid-token' });

    expect(guard.canActivate(ctx)).toBe(true);

    const req = ctx.switchToHttp().getRequest();
    expect(req.user).toEqual({
      userId: 'user-1',
      workspaceId: 'ws-1',
      role: 'Member',
    });
  });

  it('throws for missing Authorization header', () => {
    const ctx = mockContext({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws for invalid token', () => {
    token.verify.mockReturnValue(undefined);
    const ctx = mockContext({ authorization: 'Bearer bad-token' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('skips auth for @Public() endpoints', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = mockContext({});
    expect(guard.canActivate(ctx)).toBe(true);
  });
});

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  it('passes when no roles required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = mockContext(
      {},
      { userId: 'u1', workspaceId: 'ws-1', role: 'Member' },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('passes when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['Superuser']);
    const ctx = mockContext({}, undefined);
    const req = ctx.switchToHttp().getRequest();
    req.user = { userId: 'u1', workspaceId: 'ws-1', role: 'Superuser' };
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when user lacks role', () => {
    reflector.getAllAndOverride.mockReturnValue(['Superuser']);
    const ctx = mockContext({}, undefined);
    const req = ctx.switchToHttp().getRequest();
    req.user = { userId: 'u1', workspaceId: 'ws-1', role: 'Member' };
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
