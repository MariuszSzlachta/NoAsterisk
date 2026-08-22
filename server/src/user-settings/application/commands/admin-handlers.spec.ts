import { BlockUserHandler } from './block-user.handler';
import { AdminDeleteUserHandler } from './admin-delete-user.handler';
import { UserRepository } from '@auth/domain/ports/user.repository';
import { PermissionRepository } from '@auth/domain/ports/permission.repository';
import { VaultRepository } from '@user-settings/domain/ports/vault.repository';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';

const buildUser = (
  overrides: Partial<{ id: string; role: UserRole }> = {},
): User =>
  new User(
    overrides.id ?? 'user-1',
    'user@test.com',
    '$hash$',
    overrides.role ?? UserRole.Member,
    'ws-1',
    new Date(),
  );

describe('BlockUserHandler', () => {
  let handler: BlockUserHandler;
  let userRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepo = {
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      existsByEmail: jest.fn(),
      delete: jest.fn(),
    };
    handler = new BlockUserHandler(userRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('blocks a Member user', async () => {
    userRepo.findById.mockResolvedValue(buildUser());

    await handler.execute({ targetUserId: 'user-1', requesterId: 'admin-1' });

    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.Blocked }),
    );
  });

  it('unblocks a Blocked user', async () => {
    userRepo.findById.mockResolvedValue(buildUser({ role: UserRole.Blocked }));

    await handler.execute({ targetUserId: 'user-1', requesterId: 'admin-1' });

    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.Member }),
    );
  });

  it('throws when blocking self', async () => {
    await expect(
      handler.execute({ targetUserId: 'admin-1', requesterId: 'admin-1' }),
    ).rejects.toThrow('Cannot block your own account');
  });

  it('throws when user not found', async () => {
    userRepo.findById.mockResolvedValue(undefined);

    await expect(
      handler.execute({ targetUserId: 'missing', requesterId: 'admin-1' }),
    ).rejects.toThrow('User not found');
  });

  it('throws when trying to block a Superuser', async () => {
    userRepo.findById.mockResolvedValue(
      buildUser({ role: UserRole.Superuser }),
    );

    await expect(
      handler.execute({ targetUserId: 'su-1', requesterId: 'admin-1' }),
    ).rejects.toThrow('Cannot block a Superuser');
  });

  it('increments tokenVersion when blocking', async () => {
    userRepo.findById.mockResolvedValue(buildUser());

    await handler.execute({ targetUserId: 'user-1', requesterId: 'admin-1' });

    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ tokenVersion: 1 }),
    );
  });
});

describe('AdminDeleteUserHandler', () => {
  let handler: AdminDeleteUserHandler;
  let userRepo: jest.Mocked<UserRepository>;
  let permissionRepo: jest.Mocked<PermissionRepository>;
  let vaultRepo: jest.Mocked<VaultRepository>;

  beforeEach(() => {
    userRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      existsByEmail: jest.fn(),
      delete: jest.fn(),
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
    handler = new AdminDeleteUserHandler(userRepo, permissionRepo, vaultRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('deletes vault, permissions, and user', async () => {
    userRepo.findById.mockResolvedValue(buildUser());

    await handler.execute({ targetUserId: 'user-1', requesterId: 'admin-1' });

    expect(vaultRepo.deleteByWorkspaceId).toHaveBeenCalledWith('ws-1');
    expect(permissionRepo.deleteByUserId).toHaveBeenCalledWith('user-1');
    expect(userRepo.delete).toHaveBeenCalledWith('user-1');
  });

  it('throws when deleting self', async () => {
    await expect(
      handler.execute({ targetUserId: 'admin-1', requesterId: 'admin-1' }),
    ).rejects.toThrow('Cannot delete your own account');
  });

  it('throws when user not found', async () => {
    userRepo.findById.mockResolvedValue(undefined);

    await expect(
      handler.execute({ targetUserId: 'missing', requesterId: 'admin-1' }),
    ).rejects.toThrow('User not found');
  });

  it('throws when trying to delete a Superuser', async () => {
    userRepo.findById.mockResolvedValue(
      buildUser({ role: UserRole.Superuser }),
    );

    await expect(
      handler.execute({ targetUserId: 'su-1', requesterId: 'admin-1' }),
    ).rejects.toThrow('Cannot delete a Superuser');
  });
});
