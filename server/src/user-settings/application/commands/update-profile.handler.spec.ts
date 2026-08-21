import { UpdateProfileHandler } from './update-profile.handler';
import { UserRepository } from '@auth/domain/ports/user.repository';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';

describe('UpdateProfileHandler', () => {
  let handler: UpdateProfileHandler;
  let userRepo: jest.Mocked<UserRepository>;

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
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
      findById: jest.fn().mockResolvedValue(existingUser),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      delete: jest.fn(),
    };
    handler = new UpdateProfileHandler(userRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('updates display name', async () => {
    const result = await handler.execute({
      userId: 'user-1',
      displayName: 'John Doe',
    });

    expect(result).toEqual({ displayName: 'John Doe' });
    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'John Doe' }),
    );
  });

  it('trims whitespace from display name', async () => {
    const result = await handler.execute({
      userId: 'user-1',
      displayName: '  Trimmed  ',
    });

    expect(result).toEqual({ displayName: 'Trimmed' });
  });

  it('sets displayName to undefined when empty string', async () => {
    const result = await handler.execute({
      userId: 'user-1',
      displayName: '',
    });

    expect(result).toEqual({ displayName: undefined });
  });

  it('throws when name exceeds 50 characters', async () => {
    const longName = 'a'.repeat(51);

    await expect(
      handler.execute({ userId: 'user-1', displayName: longName }),
    ).rejects.toThrow('Display name cannot exceed 50 characters');
  });

  it('throws when user not found', async () => {
    userRepo.findById.mockResolvedValue(undefined);

    await expect(
      handler.execute({ userId: 'nonexistent', displayName: 'Name' }),
    ).rejects.toThrow('User not found');
  });
});
