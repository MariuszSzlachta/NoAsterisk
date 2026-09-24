import { NotFoundException } from '@nestjs/common';
import { UpdatePreferencesHandler } from './update-preferences.handler';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';
import { DEFAULT_PREFERENCES } from '@auth/domain/user-preferences.vo';
import type { UserPreferences } from '@auth/domain/user-preferences.vo';

describe('UpdatePreferencesHandler', () => {
  const mockUserRepo = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    existsByEmail: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const handler = new UpdatePreferencesHandler(mockUserRepo);

  const testUser = new User(
    'user-1',
    'test@example.com',
    'hashed-pw',
    UserRole.Member,
    'ws-1',
    new Date('2026-01-01'),
    undefined,
    DEFAULT_PREFERENCES,
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('merges partial preferences and saves', async () => {
    mockUserRepo.findById.mockResolvedValue(testUser);
    mockUserRepo.save.mockResolvedValue(undefined);

    const result = await handler.execute({
      userId: 'user-1',
      preferences: { currency: 'EUR', theme: 'light' },
    });

    expect(result.preferences).toEqual({
      ...DEFAULT_PREFERENCES,
      currency: 'EUR',
      theme: 'light',
    });
    expect(mockUserRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: {
          ...DEFAULT_PREFERENCES,
          currency: 'EUR',
          theme: 'light',
        },
      }),
    );
  });

  it('replaces all preferences when all fields provided', async () => {
    mockUserRepo.findById.mockResolvedValue(testUser);
    mockUserRepo.save.mockResolvedValue(undefined);

    const fullPrefs: UserPreferences = {
      currency: 'USD',
      dateFormat: 'YYYY-MM-DD',
      language: 'en',
      theme: 'system',
      homePage: 'transactions',
    };

    const result = await handler.execute({
      userId: 'user-1',
      preferences: fullPrefs,
    });

    expect(result.preferences).toEqual(fullPrefs);
  });

  it('preserves unchanged preferences', async () => {
    mockUserRepo.findById.mockResolvedValue(testUser);
    mockUserRepo.save.mockResolvedValue(undefined);

    const result = await handler.execute({
      userId: 'user-1',
      preferences: { language: 'en' },
    });

    expect(result.preferences.currency).toBe('PLN');
    expect(result.preferences.dateFormat).toBe('DD.MM.YYYY');
    expect(result.preferences.theme).toBe('dark');
    expect(result.preferences.homePage).toBe('dashboard');
    expect(result.preferences.language).toBe('en');
  });

  it('throws NotFoundException when user not found', async () => {
    mockUserRepo.findById.mockResolvedValue(undefined);

    await expect(
      handler.execute({
        userId: 'nonexistent',
        preferences: { currency: 'EUR' },
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
