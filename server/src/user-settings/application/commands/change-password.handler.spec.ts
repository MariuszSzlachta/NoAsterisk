import { ChangePasswordHandler } from './change-password.handler';
import { UserRepository } from '@auth/domain/ports/user.repository';
import { PasswordHasherPort } from '@auth/domain/ports/password-hasher.port';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';

describe('ChangePasswordHandler', () => {
  let handler: ChangePasswordHandler;
  let userRepo: jest.Mocked<UserRepository>;
  let hasher: jest.Mocked<PasswordHasherPort>;

  const existingUser = new User(
    'user-1',
    'test@example.com',
    '$2b$10$oldHash',
    UserRole.Member,
    'ws-1',
    new Date('2026-01-01'),
  );

  beforeEach(() => {
    userRepo = {
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
      findById: jest.fn().mockResolvedValue(existingUser),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      delete: jest.fn(),
    };
    hasher = {
      hash: jest.fn().mockResolvedValue('$2b$10$newHash'),
      compare: jest.fn(),
    };
    handler = new ChangePasswordHandler(userRepo, hasher);
  });

  afterEach(() => jest.clearAllMocks());

  it('changes password when current password is correct', async () => {
    hasher.compare
      .mockResolvedValueOnce(true) // currentPassword correct
      .mockResolvedValueOnce(false); // newPassword differs

    const result = await handler.execute({
      userId: 'user-1',
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123',
    });

    expect(result).toEqual({ success: true });
    expect(hasher.compare).toHaveBeenCalledWith(
      'oldPassword',
      '$2b$10$oldHash',
    );
    expect(hasher.hash).toHaveBeenCalledWith('newPassword123');
    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: '$2b$10$newHash' }),
    );
  });

  it('throws when current password is incorrect', async () => {
    hasher.compare.mockResolvedValueOnce(false);

    await expect(
      handler.execute({
        userId: 'user-1',
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      }),
    ).rejects.toThrow('Current password is incorrect');
  });

  it('throws when user not found', async () => {
    userRepo.findById.mockResolvedValue(undefined);

    await expect(
      handler.execute({
        userId: 'nonexistent',
        currentPassword: 'pass',
        newPassword: 'newPass123',
      }),
    ).rejects.toThrow('User not found');
  });

  it('throws when new password is same as current', async () => {
    hasher.compare
      .mockResolvedValueOnce(true) // currentPassword correct
      .mockResolvedValueOnce(true); // newPassword === current

    await expect(
      handler.execute({
        userId: 'user-1',
        currentPassword: 'samePass',
        newPassword: 'samePass',
      }),
    ).rejects.toThrow('New password must differ from current password');
  });
});
