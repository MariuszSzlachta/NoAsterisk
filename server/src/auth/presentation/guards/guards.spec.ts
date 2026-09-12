import {
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/presentation/guards/roles.guard';
import { PermissionGuard } from '@auth/presentation/guards/permission.guard';
import { TokenPort } from '@auth/domain/ports/token.port';
import { PermissionRepository } from '@auth/domain/ports/permission.repository';
import { UserRepository } from '@auth/domain/ports/user.repository';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';

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
  let userRepo: jest.Mocked<UserRepository>;
  let user: User;

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
    userRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      existsByEmail: jest.fn(),
      delete: jest.fn(),
    };
    user = new User(
      'user-1',
      'user@example.com',
      'password-hash',
      UserRole.Member,
      'ws-1',
      new Date(),
    );
    guard = new JwtAuthGuard(token, reflector, userRepo);
  });

  it('passes and sets current user for valid token', async () => {
    token.verify.mockReturnValue({
      sub: 'user-1',
      workspaceId: 'ws-1',
      role: 'Member',
      tokenVersion: 0,
    });
    userRepo.findById.mockResolvedValue(user);
    const ctx = mockContext({ authorization: 'Bearer valid-token' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);

    const req = ctx.switchToHttp().getRequest();
    expect(req.user).toEqual({
      userId: 'user-1',
      workspaceId: 'ws-1',
      role: 'Member',
    });
  });

  it('throws for missing Authorization header', async () => {
    const ctx = mockContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws for invalid token', async () => {
    token.verify.mockReturnValue(undefined);
    const ctx = mockContext({ authorization: 'Bearer bad-token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token without a revocation version', async () => {
    token.verify.mockReturnValue({
      sub: 'user-1',
      workspaceId: 'ws-1',
      role: 'Member',
    } as never);
    const ctx = mockContext({ authorization: 'Bearer legacy-token' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    expect(userRepo.findById).not.toHaveBeenCalled();
  });

  it('rejects a token when the account no longer exists', async () => {
    token.verify.mockReturnValue({
      sub: 'deleted-user',
      workspaceId: 'ws-1',
      role: 'Member',
      tokenVersion: 0,
    });
    userRepo.findById.mockResolvedValue(undefined);
    const ctx = mockContext({ authorization: 'Bearer deleted-token' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a revoked token after logout or password change', async () => {
    token.verify.mockReturnValue({
      sub: 'user-1',
      workspaceId: 'ws-1',
      role: 'Member',
      tokenVersion: 0,
    });
    userRepo.findById.mockResolvedValue(user.incrementTokenVersion());
    const ctx = mockContext({ authorization: 'Bearer revoked-token' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('skips auth for @Public() endpoints', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = mockContext({});
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
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

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: jest.Mocked<Reflector>;
  let permissionRepo: jest.Mocked<PermissionRepository>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    permissionRepo = {
      save: jest.fn(),
      findByUserAndResource: jest.fn(),
      hasPermission: jest.fn(),
      deleteByUserId: jest.fn(),
    };
    guard = new PermissionGuard(reflector, permissionRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when no @RequirePermission metadata is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = mockContext(
      {},
      { userId: 'u1', workspaceId: 'ws-1', role: 'Member' },
    );

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(permissionRepo.hasPermission).not.toHaveBeenCalled();
  });

  it('returns true when user has required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      resourceType: 'workspace',
      action: 'write',
    });
    permissionRepo.hasPermission.mockResolvedValue(true);

    const ctx = mockContext({}, undefined);
    const req = ctx.switchToHttp().getRequest();
    req.user = { userId: 'u1', workspaceId: 'ws-1', role: 'Member' };

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(permissionRepo.hasPermission).toHaveBeenCalledWith(
      'u1',
      'workspace',
      'ws-1',
      'write',
    );
  });

  it('throws ForbiddenException when user lacks required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      resourceType: 'workspace',
      action: 'admin',
    });
    permissionRepo.hasPermission.mockResolvedValue(false);

    const ctx = mockContext({}, undefined);
    const req = ctx.switchToHttp().getRequest();
    req.user = { userId: 'u1', workspaceId: 'ws-1', role: 'Member' };

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when no user on request', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      resourceType: 'workspace',
      action: 'read',
    });

    const ctx = mockContext({});

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    expect(permissionRepo.hasPermission).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException for non-workspace resource types', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      resourceType: 'sub_budget',
      action: 'read',
    });

    const ctx = mockContext({}, undefined);
    const req = ctx.switchToHttp().getRequest();
    req.user = { userId: 'u1', workspaceId: 'ws-1', role: 'Member' };

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    expect(permissionRepo.hasPermission).not.toHaveBeenCalled();
  });
});
