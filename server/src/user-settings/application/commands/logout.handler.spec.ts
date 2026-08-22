import { LogoutHandler } from './logout.handler';
import { UserRepository } from '@auth/domain/ports/user.repository';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';

describe('LogoutHandler', () => {
  let handler: LogoutHandler;
  let userRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepo = {
      save: jest.fn().mockImplementation((user: User) => Promise.resolve(user)),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;
    handler = new LogoutHandler(userRepo);
  });

  it('increments tokenVersion and returns success for valid userId', async () => {
    const user = new User(
      'user-1',
      'test@test.com',
      'hash',
      UserRole.Member,
      'ws-1',
      new Date(),
      undefined,
      undefined,
      0,
    );
    userRepo.findById.mockResolvedValue(user);

    const result = await handler.execute({ userId: 'user-1' });

    expect(result).toEqual({ success: true });
    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ tokenVersion: 1 }),
    );
  });

  it('throws when userId is empty', async () => {
    await expect(handler.execute({ userId: '' })).rejects.toThrow(
      'User ID is required for logout',
    );
  });

  it('throws NotFoundException when user not found', async () => {
    userRepo.findById.mockResolvedValue(undefined);

    await expect(handler.execute({ userId: 'nonexistent' })).rejects.toThrow(
      'User not found',
    );
  });
});
