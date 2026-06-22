import { RegisterHandler } from '@auth/application/commands/register.handler';
import { LoginHandler } from '@auth/application/commands/login.handler';
import { RefreshHandler } from '@auth/application/commands/refresh.handler';
import { UserRepository } from '@auth/domain/ports/user.repository';
import { PasswordHasherPort } from '@auth/domain/ports/password-hasher.port';
import { TokenPort } from '@auth/domain/ports/token.port';
import { WorkspaceRepository } from '@workspaces/domain/ports/workspace.repository';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';

describe('RegisterHandler', () => {
  let handler: RegisterHandler;
  let userRepo: jest.Mocked<UserRepository>;
  let workspaceRepo: jest.Mocked<WorkspaceRepository>;
  let hasher: jest.Mocked<PasswordHasherPort>;
  let token: jest.Mocked<TokenPort>;

  beforeEach(() => {
    userRepo = {
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn().mockResolvedValue(false),
    };
    workspaceRepo = {
      save: jest.fn().mockImplementation((w) => Promise.resolve(w)),
      findById: jest.fn(),
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
    handler = new RegisterHandler(userRepo, hasher, token, workspaceRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('creates workspace and user, returns access token', async () => {
    const result = await handler.execute({ email: 'user@test.com', password: 'password123' });

    expect(result.accessToken).toBe('jwt-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe('user@test.com');
    expect(result.user.role).toBe(UserRole.Member);
    expect(result.user.workspaceId).toBeDefined();
    expect(workspaceRepo.save).toHaveBeenCalledTimes(1);
    expect(userRepo.save).toHaveBeenCalledTimes(1);
    expect(hasher.hash).toHaveBeenCalledWith('password123');
  });

  it('throws when email already registered', async () => {
    userRepo.existsByEmail.mockResolvedValue(true);

    await expect(
      handler.execute({ email: 'taken@test.com', password: 'password123' }),
    ).rejects.toThrow('Email already registered');
  });

  it('signs token with correct payload', async () => {
    await handler.execute({ email: 'user@test.com', password: 'pass1234' });

    expect(token.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: expect.any(String),
        workspaceId: expect.any(String),
        role: UserRole.Member,
      }),
    );
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
      existsByEmail: jest.fn(),
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
    const result = await handler.execute({ email: 'user@test.com', password: 'password123' });

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
});

describe('RefreshHandler', () => {
  let handler: RefreshHandler;
  let token: jest.Mocked<TokenPort>;

  beforeEach(() => {
    token = {
      sign: jest.fn().mockReturnValue('new-access-token'),
      signRefresh: jest.fn(),
      verify: jest.fn(),
      verifyRefresh: jest.fn(),
    };
    handler = new RefreshHandler(token);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns new access token for valid refresh token', () => {
    token.verifyRefresh.mockReturnValue({ sub: 'user-1', workspaceId: 'ws-1', role: 'Member' });

    const result = handler.execute('valid-refresh-token');

    expect(result.accessToken).toBe('new-access-token');
    expect(token.sign).toHaveBeenCalledWith({ sub: 'user-1', workspaceId: 'ws-1', role: 'Member' });
  });

  it('throws UnauthorizedException for invalid refresh token', () => {
    token.verifyRefresh.mockReturnValue(undefined);

    expect(() => handler.execute('invalid-token')).toThrow('Invalid refresh token');
  });

  it('throws UnauthorizedException for expired refresh token', () => {
    token.verifyRefresh.mockReturnValue(undefined);

    expect(() => handler.execute('expired-token')).toThrow('Invalid refresh token');
  });
});
