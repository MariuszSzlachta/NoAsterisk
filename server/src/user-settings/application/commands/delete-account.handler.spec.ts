import { DeleteAccountHandler } from './delete-account.handler';
import { UserRepository } from '@auth/domain/ports/user.repository';
import { PasswordHasherPort } from '@auth/domain/ports/password-hasher.port';
import { PermissionRepository } from '@auth/domain/ports/permission.repository';
import { VaultRepository } from '@user-settings/domain/ports/vault.repository';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';

describe('DeleteAccountHandler', () => {
  let handler: DeleteAccountHandler;
  let userRepo: jest.Mocked<UserRepository>;
  let hasher: jest.Mocked<PasswordHasherPort>;
  let permissionRepo: jest.Mocked<PermissionRepository>;
  let vaultRepo: jest.Mocked<VaultRepository>;

  const existingUser = new User(
    'user-1',
    'test@example.com',
    '$2b$10$hash',
    UserRole.Member,
    'ws-1',
    new Date('2026-01-01'),
  );

  beforeEach(() => {
    userRepo = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(existingUser),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      existsByEmail: jest.fn(),
      delete: jest.fn(),
    };
    hasher = {
      hash: jest.fn(),
      compare: jest.fn().mockResolvedValue(true),
    };
    permissionRepo = {
      save: jest.fn(),
      findByUserAndResource: jest.fn(),
      hasPermission: jest.fn(),
      deleteByUserId: jest.fn(),
    };
    vaultRepo = {
      findByWorkspaceId: jest.fn(),
      save: jest.fn(),
      deleteByWorkspaceId: jest.fn(),
    };
    handler = new DeleteAccountHandler(
      userRepo,
      hasher,
      permissionRepo,
      vaultRepo,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('deletes account when password is correct', async () => {
    const result = await handler.execute({
      userId: 'user-1',
      workspaceId: 'ws-1',
      password: 'correctPassword',
    });

    expect(result).toEqual({ success: true });
    expect(hasher.compare).toHaveBeenCalledWith(
      'correctPassword',
      '$2b$10$hash',
    );
    expect(vaultRepo.deleteByWorkspaceId).toHaveBeenCalledWith('ws-1');
    expect(permissionRepo.deleteByUserId).toHaveBeenCalledWith('user-1');
    expect(userRepo.delete).toHaveBeenCalledWith('user-1');
  });

  it('throws when password is incorrect', async () => {
    hasher.compare.mockResolvedValue(false);

    await expect(
      handler.execute({
        userId: 'user-1',
        workspaceId: 'ws-1',
        password: 'wrongPassword',
      }),
    ).rejects.toThrow('Password is incorrect');
  });

  it('throws when workspace does not match user', async () => {
    await expect(
      handler.execute({
        userId: 'user-1',
        workspaceId: 'ws-OTHER',
        password: 'correctPassword',
      }),
    ).rejects.toThrow('Workspace mismatch');
  });

  it('throws when user not found', async () => {
    userRepo.findById.mockResolvedValue(undefined);

    await expect(
      handler.execute({
        userId: 'nonexistent',
        workspaceId: 'ws-1',
        password: 'pass',
      }),
    ).rejects.toThrow('User not found');
  });
});
