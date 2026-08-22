import { GetProfileHandler } from './get-profile.handler';
import { UserRepository } from '@auth/domain/ports/user.repository';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';
import { DEFAULT_PREFERENCES } from '@auth/domain/user-preferences.vo';

describe('GetProfileHandler', () => {
  let handler: GetProfileHandler;
  let userRepo: jest.Mocked<UserRepository>;

  const existingUser = new User(
    'user-1',
    'test@example.com',
    '$2b$hash',
    UserRole.Member,
    'ws-1',
    new Date('2026-01-15T10:00:00Z'),
    'John',
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
    handler = new GetProfileHandler(userRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns profile DTO for existing user', async () => {
    const result = await handler.execute({ userId: 'user-1' });

    expect(result).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'John',
      role: 'Member',
      workspaceId: 'ws-1',
      createdAt: '2026-01-15T10:00:00.000Z',
      preferences: DEFAULT_PREFERENCES,
    });
  });

  it('throws NotFoundException when user not found', async () => {
    userRepo.findById.mockResolvedValue(undefined);

    await expect(handler.execute({ userId: 'nonexistent' })).rejects.toThrow(
      'User not found',
    );
  });
});
