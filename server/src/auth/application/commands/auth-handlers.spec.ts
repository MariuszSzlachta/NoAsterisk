import { RegisterHandler } from '@auth/application/commands/register.handler';
import { LoginHandler } from '@auth/application/commands/login.handler';
import { RefreshHandler } from '@auth/application/commands/refresh.handler';
import { UserRepository } from '@auth/domain/ports/user.repository';
import { PasswordHasherPort } from '@auth/domain/ports/password-hasher.port';
import { TokenPort } from '@auth/domain/ports/token.port';
import { PermissionRepository } from '@auth/domain/ports/permission.repository';
import { WorkspaceRepository } from '@workspaces/domain/ports/workspace.repository';
import { InviteCodeRepository } from '@invite-codes/domain/ports/invite-code.repository';
import { InviteCode } from '@invite-codes/domain/invite-code.entity';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';
import { REGISTRATION_CONSENT } from '@auth/application/consent/registration-consent';

describe('RegisterHandler', () => {
  const consent = REGISTRATION_CONSENT;
  let handler: RegisterHandler;
  let userRepo: jest.Mocked<UserRepository>;
  let workspaceRepo: jest.Mocked<WorkspaceRepository>;
  let permissionRepo: jest.Mocked<PermissionRepository>;
  let hasher: jest.Mocked<PasswordHasherPort>;
  let token: jest.Mocked<TokenPort>;
  let inviteCodeRepo: jest.Mocked<InviteCodeRepository>;

  beforeEach(() => {
    userRepo = {
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      existsByEmail: jest.fn().mockResolvedValue(false),
      delete: jest.fn(),
    };
    workspaceRepo = {
      save: jest.fn().mockImplementation((w) => Promise.resolve(w)),
      findById: jest.fn(),
      delete: jest.fn(),
    };
    permissionRepo = {
      save: jest.fn().mockImplementation((p) => Promise.resolve(p)),
      findByUserAndResource: jest.fn(),
      hasPermission: jest.fn(),
      deleteByUserId: jest.fn(),
    };
    hasher = {
      hash: jest.fn().mockResolvedValue('$hashed$'),
      compare: jest.fn(),
    };
    token = {
      sign: jest.fn().mockReturnValue('jwt-token'),
      signRefresh: jest.fn().mockReturnValue('refresh-token'),
      verify: jest.fn(),
      verifyRefresh: jest.fn(),
    };
    inviteCodeRepo = {
      save: jest.fn().mockImplementation((c) => Promise.resolve(c)),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    handler = new RegisterHandler(
      userRepo,
      hasher,
      token,
      workspaceRepo,
      permissionRepo,
      inviteCodeRepo,
      'open',
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates workspace and user, returns access token', async () => {
    const result = await handler.execute({
      email: 'user@test.com',
      password: 'password123',
      ...consent,
    });

    expect(result.accessToken).toBe('jwt-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe('user@test.com');
    expect(result.user.role).toBe(UserRole.Member);
    expect(result.user.workspaceId).toBeDefined();
    expect(workspaceRepo.save).toHaveBeenCalledTimes(1);
    expect(userRepo.save).toHaveBeenCalledTimes(1);
    expect(permissionRepo.save).toHaveBeenCalledTimes(1);
    expect(hasher.hash).toHaveBeenCalledWith('password123');
  });

  it('persists the accepted document versions and server timestamp', async () => {
    const before = new Date();

    await handler.execute({
      email: 'consent@test.com',
      password: 'password123',
      ...consent,
    });

    const savedUser = userRepo.save.mock.calls[0]?.[0];
    expect(savedUser?.privacyPolicyVersion).toBe(consent.privacyPolicyVersion);
    expect(savedUser?.termsVersion).toBe(consent.termsVersion);
    expect(savedUser?.consentAt?.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
  });

  it('rejects a registration with an outdated document version', async () => {
    await expect(
      handler.execute({
        email: 'outdated@test.com',
        password: 'password123',
        privacyPolicyVersion: 'privacy-v0',
        termsVersion: consent.termsVersion,
      }),
    ).rejects.toThrow('Registration consent is required');
  });

  it('throws when email already registered', async () => {
    userRepo.existsByEmail.mockResolvedValue(true);

    await expect(
      handler.execute({
        email: 'taken@test.com',
        password: 'password123',
        ...consent,
      }),
    ).rejects.toThrow('Registration failed');
  });

  it('signs token with correct payload', async () => {
    await handler.execute({
      email: 'user@test.com',
      password: 'pass1234',
      ...consent,
    });

    expect(token.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: expect.any(String),
        workspaceId: expect.any(String),
        role: UserRole.Member,
      }),
    );
  });

  describe('invite-only mode', () => {
    beforeEach(() => {
      handler = new RegisterHandler(
        userRepo,
        hasher,
        token,
        workspaceRepo,
        permissionRepo,
        inviteCodeRepo,
        'invite-only',
      );
    });

    it('throws when no invite code provided', async () => {
      await expect(
        handler.execute({
          email: 'user@test.com',
          password: 'pass1234',
          ...consent,
        }),
      ).rejects.toThrow('Invite code is required');
    });

    it('throws when invite code not found', async () => {
      inviteCodeRepo.findByCode.mockResolvedValue(undefined);

      await expect(
        handler.execute({
          email: 'user@test.com',
          password: 'pass1234',
          inviteCode: 'INVALID1',
          ...consent,
        }),
      ).rejects.toThrow('Invalid invite code');
    });

    it('succeeds with valid invite code', async () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      inviteCodeRepo.findByCode.mockResolvedValue(code);
      inviteCodeRepo.findById.mockResolvedValue(code);

      const result = await handler.execute({
        email: 'user@test.com',
        password: 'pass1234',
        inviteCode: code.code,
        ...consent,
      });

      expect(result.accessToken).toBe('jwt-token');
      expect(inviteCodeRepo.save).toHaveBeenCalled();
    });

    it('marks code as used after successful registration', async () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      inviteCodeRepo.findByCode.mockResolvedValue(code);
      inviteCodeRepo.findById.mockResolvedValue(code);

      await handler.execute({
        email: 'user@test.com',
        password: 'pass1234',
        inviteCode: code.code,
        ...consent,
      });

      expect(inviteCodeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ usedBy: expect.any(String) }),
      );
    });

    it('throws when invite code is expired', async () => {
      const code = InviteCode.create({
        createdBy: 'admin-1',
        expiresAt: new Date('2020-01-01'),
      });
      inviteCodeRepo.findByCode.mockResolvedValue(code);

      await expect(
        handler.execute({
          email: 'user@test.com',
          password: 'pass1234',
          inviteCode: code.code,
          ...consent,
        }),
      ).rejects.toThrow('Invalid invite code');
    });
  });
});

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let userRepo: jest.Mocked<UserRepository>;
  let hasher: jest.Mocked<PasswordHasherPort>;
  let token: jest.Mocked<TokenPort>;

  const existingUser = new User(
    'user-1',
    'user@test.com',
    '$hashed$',
    UserRole.Member,
    'ws-1',
    new Date(),
  );

  beforeEach(() => {
    userRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(existingUser),
      findAll: jest.fn(),
      existsByEmail: jest.fn(),
      delete: jest.fn(),
    };
    hasher = {
      hash: jest.fn(),
      compare: jest.fn().mockResolvedValue(true),
    };
    token = {
      sign: jest.fn().mockReturnValue('jwt-token'),
      signRefresh: jest.fn().mockReturnValue('refresh-token'),
      verify: jest.fn(),
      verifyRefresh: jest.fn(),
    };
    handler = new LoginHandler(userRepo, hasher, token);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns access token for valid credentials', async () => {
    const result = await handler.execute({
      email: 'user@test.com',
      password: 'password123',
    });

    expect(result.accessToken).toBe('jwt-token');
    expect(result.user.id).toBe('user-1');
    expect(hasher.compare).toHaveBeenCalledWith('password123', '$hashed$');
  });

  it('throws for unknown email', async () => {
    userRepo.findByEmail.mockResolvedValue(undefined);

    await expect(
      handler.execute({ email: 'nobody@test.com', password: 'pass1234' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('throws for wrong password', async () => {
    hasher.compare.mockResolvedValue(false);

    await expect(
      handler.execute({ email: 'user@test.com', password: 'wrong' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('does not leak whether email exists in error message', async () => {
    userRepo.findByEmail.mockResolvedValue(undefined);

    try {
      await handler.execute({ email: 'nobody@test.com', password: 'x' });
    } catch (e: unknown) {
      const error = e as Error;
      expect(error.message).toBe('Invalid credentials');
      expect(error.message).not.toContain('email');
      expect(error.message).not.toContain('not found');
    }
  });

  it('throws for blocked user with correct password', async () => {
    const blockedUser = new User(
      'user-1',
      'user@test.com',
      '$hashed$',
      UserRole.Blocked,
      'ws-1',
      new Date(),
    );
    userRepo.findByEmail.mockResolvedValue(blockedUser);
    hasher.compare.mockResolvedValue(true);

    await expect(
      handler.execute({ email: 'user@test.com', password: 'password123' }),
    ).rejects.toThrow('Invalid credentials');
  });
});

describe('RefreshHandler', () => {
  let handler: RefreshHandler;
  let token: jest.Mocked<TokenPort>;
  let userRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    token = {
      sign: jest.fn().mockReturnValue('new-access-token'),
      signRefresh: jest.fn(),
      verify: jest.fn(),
      verifyRefresh: jest.fn(),
    };
    userRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      existsByEmail: jest.fn(),
      delete: jest.fn(),
    };
    handler = new RefreshHandler(token, userRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns new access token and rotated refresh token for valid refresh token', async () => {
    token.verifyRefresh.mockReturnValue({
      sub: 'user-1',
      workspaceId: 'ws-1',
      role: 'Member',
      tokenVersion: 0,
    });
    userRepo.findById.mockResolvedValue(
      new User(
        'user-1',
        'test@test.com',
        'hash',
        UserRole.Member,
        'ws-1',
        new Date(),
        undefined,
        undefined,
        0,
      ),
    );
    token.signRefresh.mockReturnValue('new-refresh-token');

    const result = await handler.execute('valid-refresh-token');

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(token.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      workspaceId: 'ws-1',
      role: 'Member',
      tokenVersion: 1,
    });
    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ tokenVersion: 1 }),
    );
  });

  it('preserves the original interactive auth time during refresh', async () => {
    token.verifyRefresh.mockReturnValue({
      sub: 'user-1',
      workspaceId: 'ws-1',
      role: 'Member',
      tokenVersion: 0,
      authTime: 123456,
      amr: 'password',
    });
    userRepo.findById.mockResolvedValue(
      new User(
        'user-1',
        'test@test.com',
        'hash',
        UserRole.Member,
        'ws-1',
        new Date(),
        undefined,
        undefined,
        0,
      ),
    );

    await handler.execute('valid-refresh-token');

    expect(token.sign).toHaveBeenCalledWith(
      expect.objectContaining({ authTime: 123456, amr: 'password' }),
    );
  });

  it('throws UnauthorizedException for invalid refresh token', async () => {
    token.verifyRefresh.mockReturnValue(undefined);

    await expect(handler.execute('invalid-token')).rejects.toThrow(
      'Invalid refresh token',
    );
  });

  it('throws UnauthorizedException for expired refresh token', async () => {
    token.verifyRefresh.mockReturnValue(undefined);

    await expect(handler.execute('expired-token')).rejects.toThrow(
      'Invalid refresh token',
    );
  });

  it('throws UnauthorizedException when tokenVersion mismatches (revoked)', async () => {
    token.verifyRefresh.mockReturnValue({
      sub: 'user-1',
      workspaceId: 'ws-1',
      role: 'Member',
      tokenVersion: 0,
    });
    userRepo.findById.mockResolvedValue(
      new User(
        'user-1',
        'test@test.com',
        'hash',
        UserRole.Member,
        'ws-1',
        new Date(),
        undefined,
        undefined,
        1,
      ),
    );

    await expect(handler.execute('revoked-token')).rejects.toThrow(
      'Token has been revoked',
    );
  });

  it('rejects a refresh token without a token version', async () => {
    token.verifyRefresh.mockReturnValue({
      sub: 'user-1',
      workspaceId: 'ws-1',
      role: 'Member',
    });
    userRepo.findById.mockResolvedValue(
      new User(
        'user-1',
        'test@test.com',
        'hash',
        UserRole.Member,
        'ws-1',
        new Date(),
      ),
    );

    await expect(handler.execute('legacy-refresh-token')).rejects.toThrow(
      'Token has been revoked',
    );
  });
});
